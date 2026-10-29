import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { CardElement, CardSize, Orientation, CARD_DIMENSIONS } from "./types";

/**
 * Safely loads an image URL or DataURL into an HTMLImageElement without tainting the canvas.
 */
async function loadImageSafe(src?: string | null): Promise<HTMLImageElement | null> {
  if (!src || typeof src !== "string" || src.trim() === "") return null;
  if (src.includes("placeholder-student") || src.includes("placeholder-logo")) return null;

  let resolvedSrc = src.trim();
  if (resolvedSrc.startsWith("C:") || resolvedSrc.startsWith("file:")) {
    resolvedSrc = `/api/files?path=${encodeURIComponent(resolvedSrc)}`;
  }

  // First try fetching as blob -> dataURL if it's an external or API URL to avoid any CORS taint
  if (!resolvedSrc.startsWith("data:")) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(resolvedSrc, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const blob = await res.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        resolvedSrc = dataUrl;
      }
    } catch {
      // Fallback to direct Image element load
    }
  }

  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const timer = setTimeout(() => resolve(null), 2500);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = resolvedSrc;
  });
}

/**
 * Resolves dynamic variable tokens ({{student_name}}, {{qr_code}}, etc.) for a given student & branch.
 */
export function resolveCardElementContent(
  el: CardElement,
  activeStudent?: any,
  activeBranch?: any,
  defaultSchoolName = "CES BOURJA MARADI"
): string {
  let contentStr = el.content || "";
  if (!el.variableKey) return contentStr;

  if (el.variableKey === "{{student_name}}") {
    contentStr = activeStudent
      ? `${activeStudent.nomEtudiant || ""} ${activeStudent.prenomEtudiant || ""}`.trim()
      : "MAMADOU SOW";
  } else if (el.variableKey === "{{student_id}}") {
    contentStr = activeStudent?.numAdmission
      ? `Matricule: ${activeStudent.numAdmission}`
      : "Matricule: EDUT-100482";
  } else if (el.variableKey === "{{class}}") {
    contentStr = activeStudent?.classe ? `Classe: ${activeStudent.classe}` : "Classe: 6ème A";
  } else if (el.variableKey === "{{section}}") {
    contentStr = activeStudent?.section || "Général";
  } else if (el.variableKey === "{{gender}}") {
    contentStr = activeStudent?.sexe || "Masculin";
  } else if (el.variableKey === "{{birth_date}}") {
    contentStr = activeStudent?.dateNaissance || "14/05/2012";
  } else if (el.variableKey === "{{birth_place}}") {
    contentStr = activeStudent?.lieuNaissance || "Maradi";
  } else if (el.variableKey === "{{blood_type}}") {
    contentStr = activeStudent?.groupeSanguin || "O+";
  } else if (el.variableKey === "{{phone}}") {
    contentStr =
      activeStudent?.whatsapp ||
      activeStudent?.mobile ||
      activeStudent?.phoneFixe ||
      activeStudent?.telTuteur ||
      activeStudent?.telephone ||
      "+227 90 00 00 00";
  } else if (el.variableKey === "{{guardian}}") {
    contentStr = activeStudent?.nomPere || activeStudent?.tuteur || "Parent d'élève";
  } else if (el.variableKey === "{{address}}") {
    contentStr = activeStudent?.adresse || "Maradi, République du Niger";
  } else if (el.variableKey === "{{school_name}}") {
    const rawBranchName =
      activeBranch?.nomBranch || activeBranch?.branchName || activeBranch?.name || "";
    const isGeneric =
      !rawBranchName ||
      rawBranchName.toLowerCase().includes("école gestion") ||
      rawBranchName.toLowerCase().includes("ecole gestion") ||
      rawBranchName.toLowerCase().includes("main") ||
      rawBranchName.toLowerCase().includes("principal");
    let cachedSchoolName = "";
    if (typeof window !== "undefined") {
      try {
        const u = JSON.parse(localStorage.getItem("edut_user_session") || "{}");
        cachedSchoolName = u?.school?.name || "";
      } catch {}
    }
    contentStr = (!isGeneric ? rawBranchName : cachedSchoolName) || defaultSchoolName;
  } else if (el.variableKey === "{{academic_year}}") {
    contentStr = "2025-2026";
  } else if (el.variableKey === "{{director}}") {
    contentStr = activeBranch?.directorName || "Le Directeur Général";
  } else if (el.variableKey === "{{school_phone}}") {
    contentStr = activeBranch?.telephone || activeBranch?.contactNo || "+227 90 00 00 00";
  } else if (el.variableKey === "{{school_email}}") {
    contentStr = activeBranch?.email || "contact@ces-bourja.ne";
  } else if (el.variableKey === "{{issue_date}}") {
    contentStr = new Date().toLocaleDateString("fr-FR");
  } else if (el.variableKey === "{{expiry_date}}") {
    contentStr = "31/07/2026";
  } else if (el.variableKey === "{{status_badge}}") {
    contentStr = "ÉLÈVE RÉGULIER";
  } else if (el.variableKey === "{{qr_code}}") {
    contentStr = activeStudent
      ? JSON.stringify({
          type: "student_pass",
          student_id: activeStudent.id,
          num_admission: activeStudent.numAdmission || `ID-${activeStudent.id}`,
          nom_etudiant: `${activeStudent.nomEtudiant || ""} ${activeStudent.prenomEtudiant || ""}`.trim(),
          classe: activeStudent.classe || "",
        })
      : "EDUT-CARD-VERIFIED";
  } else if (el.variableKey === "{{barcode}}") {
    contentStr = activeStudent?.numAdmission || "BRJ-2027-0001";
  }

  return contentStr;
}

/**
 * Draws a rounded rectangle path on a Canvas 2D context.
 */
function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Parses a CSS linear-gradient(...) string into a native CanvasGradient.
 */
function createCanvasGradient(
  ctx: CanvasRenderingContext2D,
  bgGradient: string,
  x: number,
  y: number,
  w: number,
  h: number
): CanvasGradient | string {
  try {
    const angleMatch = bgGradient.match(/(-?\d+(?:\.\d+)?)deg/);
    const angleDeg = angleMatch ? parseFloat(angleMatch[1]) : 135;
    const rad = ((angleDeg - 90) * Math.PI) / 180;

    const cx = x + w / 2;
    const cy = y + h / 2;
    const len = (Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad))) / 2;

    const x0 = cx - Math.cos(rad) * len;
    const y0 = cy - Math.sin(rad) * len;
    const x1 = cx + Math.cos(rad) * len;
    const y1 = cy + Math.sin(rad) * len;

    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    const stopRegex = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))\s*(\d+(?:\.\d+)?%)?/g;
    const matches = Array.from(bgGradient.matchAll(stopRegex));

    if (matches.length === 0) return "#1e293b";

    matches.forEach((m, idx) => {
      const color = m[1];
      const pctStr = m[2];
      const offset = pctStr
        ? Math.min(1, Math.max(0, parseFloat(pctStr) / 100))
        : matches.length > 1
        ? idx / (matches.length - 1)
        : 0;
      grad.addColorStop(offset, color);
    });

    return grad;
  } catch {
    return "#1e293b";
  }
}

/**
 * Draws wrapped and multiline text inside a bounding box on a Canvas 2D context.
 */
function drawElementText(
  ctx: CanvasRenderingContext2D,
  text: string,
  el: CardElement,
  scale: number,
  isCenteredVertically = true
) {
  if (!text) return;

  const fontSize = (el.fontSize || 12) * scale;
  const fontWeight = el.fontWeight || "normal";
  const fontStyle = el.fontStyle || "normal";
  const fontFamily = el.fontFamily ? `${el.fontFamily}, Arial, sans-serif` : "Arial, sans-serif";

  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = el.color || "#111827";
  ctx.textBaseline = "middle";

  const displayStr =
    el.textTransform === "uppercase"
      ? text.toUpperCase()
      : el.textTransform === "lowercase"
      ? text.toLowerCase()
      : text;

  const maxW = Math.max(10, el.width * scale - 2 * scale);
  const rawParagraphs = displayStr.split("\n");
  const lines: string[] = [];

  for (const para of rawParagraphs) {
    const words = para.split(" ");
    let currentLine = "";
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxW && currentLine) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine || para === "") {
      lines.push(currentLine);
    }
  }

  const lineHeight = fontSize * (el.lineHeight || 1.25);
  const totalTextH = lines.length * lineHeight;
  const boxW = el.width * scale;
  const boxH = el.height * scale;

  let startY = isCenteredVertically
    ? (boxH - totalTextH) / 2 + lineHeight / 2
    : lineHeight / 2 + 2 * scale;

  // Keep inside top bound if multiline overflows slightly
  if (startY < lineHeight / 2) {
    startY = lineHeight / 2;
  }

  const align = el.textAlign || (el.type === "badge" || el.type === "watermark" ? "center" : "left");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const yPos = startY + i * lineHeight;
    if (yPos > boxH + lineHeight * 0.4) break;

    let xPos = 0;
    if (align === "center") {
      ctx.textAlign = "center";
      xPos = boxW / 2;
    } else if (align === "right") {
      ctx.textAlign = "right";
      xPos = boxW - 2 * scale;
    } else {
      ctx.textAlign = "left";
      xPos = 0;
    }

    ctx.fillText(line, xPos, yPos);
  }
}

/**
 * Pure Native HTML5 Canvas 2D Ultra-HD Renderer (384 DPI at scale=4).
 * Completely immune to Tailwind v4 oklch() errors and hidden DOM tab issues.
 */
export async function renderCardElementsToDataURL(options: {
  elements: CardElement[];
  cardType: CardSize;
  orientation: Orientation;
  activeStudent?: any;
  activeBranch?: any;
  scale?: number;
  format?: "png" | "jpeg";
}): Promise<string> {
  const {
    elements,
    cardType = "CR80",
    orientation = "landscape",
    activeStudent,
    activeBranch,
    scale = 4, // 4x = 1296x816 px (~384 DPI)
    format = "png",
  } = options;

  const baseDim = CARD_DIMENSIONS[cardType] || CARD_DIMENSIONS.CR80;
  const cardWidth = orientation === "landscape" ? baseDim.width : baseDim.height;
  const cardHeight = orientation === "landscape" ? baseDim.height : baseDim.width;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cardWidth * scale);
  canvas.height = Math.round(cardHeight * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // High quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Base white card background with rounded corners
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  for (const el of sortedElements) {
    if (el.hidden) continue;

    ctx.save();

    const x = el.x * scale;
    const y = el.y * scale;
    const w = el.width * scale;
    const h = el.height * scale;

    // Translate to element origin & apply rotation if any
    if (el.rotation) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-w / 2, -h / 2);
    } else {
      ctx.translate(x, y);
    }

    ctx.globalAlpha = el.opacity ?? 1;

    const radius =
      el.shapeType === "circle" || el.circularCrop
        ? Math.min(w, h) / 2
        : (el.borderRadius || 0) * scale;

    // 1. Background Fill (backgroundColor or bgGradient)
    if (el.bgGradient && el.bgGradient !== "none") {
      roundRectPath(ctx, 0, 0, w, h, radius);
      ctx.fillStyle = createCanvasGradient(ctx, el.bgGradient, 0, 0, w, h);
      ctx.fill();
    } else if (el.backgroundColor && el.backgroundColor !== "transparent") {
      roundRectPath(ctx, 0, 0, w, h, radius);
      ctx.fillStyle = el.backgroundColor;
      ctx.fill();
    }

    const contentStr = resolveCardElementContent(el, activeStudent, activeBranch);

    // 2. Render Element Type Specific Content
    if (el.type === "text" || el.type === "variable") {
      const isMultiline = contentStr.includes("\n") || contentStr.length > 42;
      drawElementText(ctx, contentStr, el, scale, !isMultiline);
    } else if (el.type === "badge" || el.type === "watermark") {
      drawElementText(ctx, contentStr, { ...el, textAlign: "center", fontWeight: "bold" }, scale, true);
    } else if (el.type === "studentPhoto") {
      const rawPhoto = activeStudent?.photoPath || el.src;
      const img = await loadImageSafe(rawPhoto);

      ctx.save();
      roundRectPath(ctx, 0, 0, w, h, radius || 8 * scale);
      ctx.clip();

      if (img) {
        // Object-fit: cover
        const imgRatio = img.width / img.height;
        const boxRatio = w / h;
        let drawW = w;
        let drawH = h;
        let offsetX = 0;
        let offsetY = 0;
        if (imgRatio > boxRatio) {
          drawW = h * imgRatio;
          offsetX = (w - drawW) / 2;
        } else {
          drawH = w / imgRatio;
          offsetY = (h - drawH) * 0.2; // top-bias for portraits
        }
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      } else {
        // Clean fallback avatar box
        ctx.fillStyle = "#f1f5f9";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#94a3b8";
        ctx.beginPath();
        ctx.arc(w / 2, h * 0.36, Math.min(w, h) * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w / 2, h * 0.78, Math.min(w, h) * 0.28, Math.PI, 0, false);
        ctx.fill();
        ctx.fillStyle = "#64748b";
        ctx.font = `bold ${7 * scale}px Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("PHOTO ÉLÈVE", w / 2, h - 8 * scale);
      }
      ctx.restore();
    } else if (el.type === "schoolLogo" || el.type === "image") {
      const rawSrc =
        el.type === "schoolLogo"
          ? activeBranch?.logoPath || el.src || "/logo.png"
          : el.src;
      const img = await loadImageSafe(rawSrc);

      if (img) {
        ctx.save();
        roundRectPath(ctx, 0, 0, w, h, radius);
        ctx.clip();

        // Object-fit: contain for schoolLogo, cover for generic image
        if (el.type === "schoolLogo") {
          const pad = 2 * scale;
          const availW = w - pad * 2;
          const availH = h - pad * 2;
          const scaleFactor = Math.min(availW / img.width, availH / img.height);
          const drawW = img.width * scaleFactor;
          const drawH = img.height * scaleFactor;
          ctx.drawImage(img, (w - drawW) / 2, (h - drawH) / 2, drawW, drawH);
        } else {
          ctx.drawImage(img, 0, 0, w, h);
        }
        ctx.restore();
      }
    } else if (el.type === "qrcode") {
      const qrBoxR = (el.borderRadius || 6) * scale;
      roundRectPath(ctx, 0, 0, w, h, qrBoxR);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.lineWidth = 1 * scale;
      ctx.strokeStyle = "#e2e8f0";
      ctx.stroke();

      try {
        const qrDataUrl = await QRCode.toDataURL(contentStr || "EDUT-QR-VERIFIED", {
          errorCorrectionLevel: "M",
          margin: 1,
          width: Math.round(Math.min(w, h) * 1.2),
          color: { dark: "#0f172a", light: "#ffffff" },
        });
        const qrImg = await loadImageSafe(qrDataUrl);
        if (qrImg) {
          const pad = 3.5 * scale;
          const size = Math.min(w, h) - pad * 2;
          ctx.drawImage(qrImg, (w - size) / 2, (h - size) / 2, size, size);
        }
      } catch (e) {
        console.warn("QR render warning:", e);
      }
    } else if (el.type === "barcode") {
      const bcR = (el.borderRadius || 5) * scale;
      roundRectPath(ctx, 0, 0, w, h, bcR);
      ctx.fillStyle = el.backgroundColor || "#ffffff";
      ctx.fill();
      ctx.lineWidth = 0.8 * scale;
      ctx.strokeStyle = "#e2e8f0";
      ctx.stroke();

      const padX = 6 * scale;
      const barAreaW = w - padX * 2;
      const barAreaH = h * 0.58;
      const barTop = 3 * scale;
      const numBars = 36;
      const step = barAreaW / numBars;

      ctx.fillStyle = "#0f172a";
      for (let i = 0; i < numBars; i++) {
        const barW =
          i % 5 === 0 ? step * 0.68 : i % 3 === 0 ? step * 0.48 : step * 0.28;
        ctx.fillRect(padX + i * step, barTop, barW, barAreaH);
      }

      ctx.font = `bold ${6.2 * scale}px monospace`;
      ctx.fillStyle = "#1e293b";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(contentStr || "BRJ-2027-0001", w / 2, h - 1.5 * scale);
    } else if (el.type === "signature" || el.type === "stamp") {
      roundRectPath(ctx, 0, 0, w, h, (el.borderRadius || 4) * scale);
      ctx.fillStyle = "rgba(238, 242, 255, 0.7)";
      ctx.fill();
      ctx.setLineDash([3 * scale, 2 * scale]);
      ctx.lineWidth = 1.2 * scale;
      ctx.strokeStyle = "#818cf8";
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#4338ca";
      ctx.font = `bold ${7.2 * scale}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText((contentStr || "LA DIRECTION").toUpperCase(), w / 2, h / 2);
    }

    // 3. Element Border Stroke
    if (el.borderWidth && el.borderWidth > 0 && el.borderColor && el.borderColor !== "transparent") {
      roundRectPath(ctx, 0, 0, w, h, radius);
      ctx.lineWidth = el.borderWidth * scale;
      ctx.strokeStyle = el.borderColor;
      if (el.borderStyle === "dashed") {
        ctx.setLineDash([4 * scale, 2.5 * scale]);
      } else if (el.borderStyle === "dotted") {
        ctx.setLineDash([1.5 * scale, 1.5 * scale]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  return canvas.toDataURL(`image/${format}`, 1.0);
}

/**
 * Exports either a single side or both Recto + Verso (2 pages in exact CR80 / card mm dimensions)
 * at ultra-high 300+ DPI resolution using the native Canvas 2D renderer.
 */
export async function exportCardToPDF(
  cardType: CardSize,
  orientation: Orientation,
  name: string,
  options?: {
    includeVerso?: boolean;
    rectoElements?: CardElement[];
    versoElements?: CardElement[];
    activeElements?: CardElement[];
    activeStudent?: any;
    activeBranch?: any;
    onSwitchSide?: (side: "recto" | "verso") => Promise<void>;
    currentSide?: "recto" | "verso";
  }
) {
  const isPortrait = orientation === "portrait";
  const baseMm = CARD_DIMENSIONS[cardType || "CR80"] || CARD_DIMENSIONS.CR80;
  const pageW = isPortrait ? baseMm.mmHeight : baseMm.mmWidth;
  const pageH = isPortrait ? baseMm.mmWidth : baseMm.mmHeight;

  const doc = new jsPDF({
    orientation: isPortrait ? "portrait" : "landscape",
    unit: "mm",
    format: [pageW, pageH],
    compress: false,
  });

  if (options?.includeVerso && options?.rectoElements && options?.versoElements) {
    const rectoImg = await renderCardElementsToDataURL({
      elements: options.rectoElements,
      cardType,
      orientation,
      activeStudent: options.activeStudent,
      activeBranch: options.activeBranch,
      scale: 4,
    });
    doc.addImage(rectoImg, "PNG", 0, 0, pageW, pageH);

    const versoImg = await renderCardElementsToDataURL({
      elements: options.versoElements,
      cardType,
      orientation,
      activeStudent: options.activeStudent,
      activeBranch: options.activeBranch,
      scale: 4,
    });
    doc.addPage([pageW, pageH], isPortrait ? "portrait" : "landscape");
    doc.addImage(versoImg, "PNG", 0, 0, pageW, pageH);
  } else if (options?.activeElements) {
    const imgData = await renderCardElementsToDataURL({
      elements: options.activeElements,
      cardType,
      orientation,
      activeStudent: options.activeStudent,
      activeBranch: options.activeBranch,
      scale: 4,
    });
    doc.addImage(imgData, "PNG", 0, 0, pageW, pageH);
  }

  const suffix = options?.includeVerso ? "Recto_Verso_HD" : "HD_300DPI";
  const safeName = (name || "Carte_Scolaire").replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`${safeName}_${suffix}.pdf`);
}

export async function exportCardToImage(
  format: "png" | "jpeg",
  name: string,
  options?: {
    elements?: CardElement[];
    cardType?: CardSize;
    orientation?: Orientation;
    activeStudent?: any;
    activeBranch?: any;
  }
) {
  if (!options?.elements) return;

  const imgData = await renderCardElementsToDataURL({
    elements: options.elements,
    cardType: options.cardType || "CR80",
    orientation: options.orientation || "landscape",
    activeStudent: options.activeStudent,
    activeBranch: options.activeBranch,
    scale: 4,
    format,
  });

  const link = document.createElement("a");
  link.href = imgData;
  const safeName = (name || "Carte_Scolaire").replace(/[^a-zA-Z0-9_-]/g, "_");
  link.download = `${safeName}_HD_300DPI.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportCardToJSON(
  rectoElements: CardElement[],
  versoElements: CardElement[],
  cardType: CardSize,
  orientation: Orientation,
  name: string
) {
  const payload = {
    templateName: name,
    cardType,
    orientation,
    rectoElements,
    versoElements,
    createdAt: new Date().toISOString(),
  };

  const dataStr =
    "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `${name.replace(/\s+/g, "_")}_CardTemplate.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
