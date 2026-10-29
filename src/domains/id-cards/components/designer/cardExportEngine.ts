import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { CardElement, CardSize, Orientation, CARD_DIMENSIONS } from "./types";

async function captureElementHighDPI(el: HTMLElement, scale = 4, bg: string | null = "#ffffff"): Promise<string> {
  // Ensure all images inside the element have crossOrigin set or loaded
  const imgs = Array.from(el.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalHeight > 0) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(resolve, 1200);
          }
        })
    )
  );

  const canvas = await html2canvas(el, {
    scale, // 4x = ~384 DPI crisp output
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: bg,
    imageTimeout: 5000,
    onclone: (clonedDoc) => {
      // Remove any grid pattern or selection rings in the exported clone
      const sheet = clonedDoc.getElementById("card-studio-active-canvas");
      if (sheet) {
        sheet.classList.remove("bg-grid-pattern");
      }
      clonedDoc.querySelectorAll(".ring-indigo-600, .ring-offset-2").forEach((node) => {
        node.classList.remove("ring-2", "ring-indigo-600", "ring-offset-2");
      });
    },
  });

  return canvas.toDataURL("image/png", 1.0);
}

/**
 * Exports either a single side or both Recto + Verso (2 pages in exact CR80 / card mm dimensions)
 * at ultra-high 300+ DPI resolution.
 */
export async function exportCardToPDF(
  cardType: CardSize,
  orientation: Orientation,
  name: string,
  options?: {
    includeVerso?: boolean;
    onSwitchSide?: (side: "recto" | "verso") => Promise<void>;
    currentSide?: "recto" | "verso";
  }
) {
  const element = (document.getElementById("card-studio-active-canvas") ||
    document.querySelector(".card-studio-canvas-sheet") ||
    document.querySelector(".bg-white.shadow-2xl")) as HTMLElement | null;
  if (!element) return;

  const isPortrait = orientation === "portrait";
  const pageW = isPortrait ? 54.0 : 85.6;
  const pageH = isPortrait ? 85.6 : 54.0;

  try {
    const doc = new jsPDF({
      orientation: isPortrait ? "portrait" : "landscape",
      unit: "mm",
      format: [pageW, pageH],
      compress: false,
    });

    if (options?.includeVerso && options?.onSwitchSide) {
      const initialSide = options.currentSide || "recto";
      // 1. Capture Recto
      if (initialSide !== "recto") {
        await options.onSwitchSide("recto");
      }
      const rectoTarget = (document.getElementById("card-studio-active-canvas") || element) as HTMLElement;
      const rectoImg = await captureElementHighDPI(rectoTarget, 4, "#ffffff");
      doc.addImage(rectoImg, "PNG", 0, 0, pageW, pageH, undefined, "FAST");

      // 2. Capture Verso on Page 2
      await options.onSwitchSide("verso");
      const versoTarget = (document.getElementById("card-studio-active-canvas") || element) as HTMLElement;
      const versoImg = await captureElementHighDPI(versoTarget, 4, "#ffffff");
      doc.addPage([pageW, pageH], isPortrait ? "portrait" : "landscape");
      doc.addImage(versoImg, "PNG", 0, 0, pageW, pageH, undefined, "FAST");

      // Restore initial side
      if (initialSide === "recto") {
        await options.onSwitchSide("recto");
      }
    } else {
      const imgData = await captureElementHighDPI(element, 4, "#ffffff");
      doc.addImage(imgData, "PNG", 0, 0, pageW, pageH, undefined, "FAST");
    }

    const suffix = options?.includeVerso ? "Recto_Verso_HD" : "HD_300DPI";
    doc.save(`${name.replace(/\s+/g, "_")}_${suffix}.pdf`);
  } catch (err) {
    console.error("Export Card PDF error:", err);
  }
}

export async function exportCardToImage(format: "png" | "jpeg", name: string) {
  const element = (document.getElementById("card-studio-active-canvas") ||
    document.querySelector(".card-studio-canvas-sheet") ||
    document.querySelector(".bg-white.shadow-2xl")) as HTMLElement | null;
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 4, // 4x Ultra-HD
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: format === "jpeg" ? "#ffffff" : null,
      onclone: (clonedDoc) => {
        const sheet = clonedDoc.getElementById("card-studio-active-canvas");
        if (sheet) sheet.classList.remove("bg-grid-pattern");
      },
    });

    const imgData = canvas.toDataURL(`image/${format}`, 1.0);
    const link = document.createElement("a");
    link.href = imgData;
    link.download = `${name.replace(/\s+/g, "_")}_HD_300DPI.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Export Image error:", err);
  }
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

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `${name.replace(/\s+/g, "_")}_CardTemplate.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
