"use client";

import { useRef, useState } from "react";
import { CardElement, CardSize, Orientation, CARD_DIMENSIONS } from "./types";
import { QRCodeSVG } from "qrcode.react";
import {
  RotateCw, Lock, EyeOff, QrCode, Barcode, ShieldCheck, User, Building2, MapPin, Phone, Mail, Calendar,
  Globe, Smartphone, Send, GraduationCap, BookOpen, LibraryBig, Award, Bookmark, Medal, ShieldAlert,
  Fingerprint, Key, BadgeCheck, CheckCircle2, Clock, History, Star, Heart, Sparkles, AlertCircle, Info, Hash, Image as ImageIcon
} from "lucide-react";

interface CardCanvasProps {
  elements: CardElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<CardElement>) => void;
  cardType: CardSize;
  orientation: Orientation;
  zoom: number;
  showGrid: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  activeStudent?: any;
  activeBranch?: any;
  readOnly?: boolean;
}

export default function CardCanvas({
  elements,
  selectedId,
  onSelect,
  onUpdateElement,
  cardType,
  orientation,
  zoom,
  showGrid,
  showRulers,
  snapToGrid,
  activeStudent,
  activeBranch,
  readOnly = false,
}: CardCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [snapLines, setSnapLines] = useState<{ x?: number; y?: number }>({});

  const baseDim = CARD_DIMENSIONS[cardType] || CARD_DIMENSIONS.CR80;
  const cardWidth = orientation === "landscape" ? baseDim.width : baseDim.height;
  const cardHeight = orientation === "landscape" ? baseDim.height : baseDim.width;

  const scale = zoom / 100;

  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  // Pointer dragging logic
  const handlePointerDown = (e: React.PointerEvent, el: CardElement) => {
    if (el.locked || el.hidden) return;
    e.stopPropagation();
    onSelect(el.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialElX = el.x;
    const initialElY = el.y;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;

      let newX = Math.round(initialElX + dx);
      let newY = Math.round(initialElY + dy);

      const guides: { x?: number; y?: number } = {};
      if (snapToGrid) {
        const snapThreshold = 5;
        const centerX = cardWidth / 2;
        const centerY = cardHeight / 2;

        if (Math.abs(newX + el.width / 2 - centerX) < snapThreshold) {
          newX = centerX - el.width / 2;
          guides.x = centerX;
        }
        if (Math.abs(newY + el.height / 2 - centerY) < snapThreshold) {
          newY = centerY - el.height / 2;
          guides.y = centerY;
        }

        if (Math.abs(newX) < snapThreshold) { newX = 0; guides.x = 0; }
        if (Math.abs(newY) < snapThreshold) { newY = 0; guides.y = 0; }
        if (Math.abs(newX + el.width - cardWidth) < snapThreshold) { newX = cardWidth - el.width; guides.x = cardWidth; }
        if (Math.abs(newY + el.height - cardHeight) < snapThreshold) { newY = cardHeight - el.height; guides.y = cardHeight; }
      }

      setSnapLines(guides);
      onUpdateElement(el.id, { x: newX, y: newY });
    };

    const handlePointerUp = () => {
      setSnapLines({});
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // Resize handle dragging
  const handleResizeStart = (e: React.PointerEvent, el: CardElement, handle: string) => {
    if (el.locked) return;
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const { x, y, width, height } = el;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;

      let newW = width;
      let newH = height;
      let newX = x;
      let newY = y;

      if (handle.includes("e")) newW = Math.max(15, width + dx);
      if (handle.includes("s")) newH = Math.max(10, height + dy);
      if (handle.includes("w")) {
        const potentialW = width - dx;
        if (potentialW > 15) {
          newW = potentialW;
          newX = x + dx;
        }
      }
      if (handle.includes("n")) {
        const potentialH = height - dy;
        if (potentialH > 10) {
          newH = potentialH;
          newY = y + dy;
        }
      }

      onUpdateElement(el.id, { x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) });
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // Rotation handle dragging
  const handleRotateStart = (e: React.PointerEvent, el: CardElement) => {
    if (el.locked) return;
    e.stopPropagation();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + (el.x + el.width / 2) * scale;
    const centerY = rect.top + (el.y + el.height / 2) * scale;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const radians = Math.atan2(moveEvent.clientX - centerX, -(moveEvent.clientY - centerY));
      let degrees = Math.round(radians * (180 / Math.PI));
      if (degrees < 0) degrees += 360;

      const snapAngles = [0, 45, 90, 180, 270, 360];
      for (const angle of snapAngles) {
        if (Math.abs(degrees - angle) < 4) {
          degrees = angle % 360;
          break;
        }
      }

      onUpdateElement(el.id, { rotation: degrees });
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // Icon renderer helper
  const renderIcon = (name?: string) => {
    const props = { size: 16 * scale };
    if (name === "Phone") return <Phone {...props} />;
    if (name === "Mail") return <Mail {...props} />;
    if (name === "Address") return <MapPin {...props} />;
    if (name === "School") return <Building2 {...props} />;
    if (name === "Calendar") return <Calendar {...props} />;
    if (name === "Globe") return <Globe {...props} />;
    if (name === "Smartphone") return <Smartphone {...props} />;
    if (name === "Send") return <Send {...props} />;
    if (name === "GraduationCap") return <GraduationCap {...props} />;
    if (name === "BookOpen") return <BookOpen {...props} />;
    if (name === "LibraryBig") return <LibraryBig {...props} />;
    if (name === "Award") return <Award {...props} />;
    if (name === "Bookmark") return <Bookmark {...props} />;
    if (name === "Medal") return <Medal {...props} />;
    if (name === "ShieldAlert") return <ShieldAlert {...props} />;
    if (name === "Fingerprint") return <Fingerprint {...props} />;
    if (name === "Lock") return <Lock {...props} />;
    if (name === "Key") return <Key {...props} />;
    if (name === "BadgeCheck") return <BadgeCheck {...props} />;
    if (name === "CheckCircle2") return <CheckCircle2 {...props} />;
    if (name === "Clock") return <Clock {...props} />;
    if (name === "History") return <History {...props} />;
    if (name === "Star") return <Star {...props} />;
    if (name === "Heart") return <Heart {...props} />;
    if (name === "Sparkles") return <Sparkles {...props} />;
    if (name === "AlertCircle") return <AlertCircle {...props} />;
    if (name === "Info") return <Info {...props} />;
    if (name === "Hash") return <Hash {...props} />;
    if (name === "ShieldCheck") return <ShieldCheck {...props} />;
    return <User {...props} />;
  };

  const sheetContent = (
    <div
      id={readOnly ? undefined : "card-studio-active-canvas"}
      ref={canvasRef}
      style={{
        width: cardWidth * scale,
        height: cardHeight * scale,
        borderRadius: 14 * scale,
      }}
      className={`card-studio-canvas-sheet relative bg-white transition-all overflow-hidden ${
        readOnly
          ? "border border-slate-200"
          : `shadow-2xl border border-slate-300 dark:border-slate-700 ${showGrid ? "bg-grid-pattern" : ""}`
      }`}
    >
        {/* Alignment Snap Lines */}
        {snapLines.x !== undefined && (
          <div className="absolute top-0 bottom-0 border-r-2 border-dashed border-rose-500 z-50 pointer-events-none" style={{ left: snapLines.x * scale }} />
        )}
        {snapLines.y !== undefined && (
          <div className="absolute left-0 right-0 border-b-2 border-dashed border-rose-500 z-50 pointer-events-none" style={{ top: snapLines.y * scale }} />
        )}

        {/* Render Elements */}
        {sortedElements.map((el) => {
          if (el.hidden) return null;
          const isSelected = el.id === selectedId;

          // Replace token variables if student or branch data is available
          let contentStr = el.content || "";
          if (el.variableKey) {
            if (el.variableKey === "{{student_name}}") contentStr = activeStudent ? `${activeStudent.nomEtudiant || ""} ${activeStudent.prenomEtudiant || ""}`.trim() : "MAMADOU SOW";
            else if (el.variableKey === "{{student_id}}") contentStr = activeStudent?.numAdmission ? `Matricule: ${activeStudent.numAdmission}` : "Matricule: EDUT-100482";
            else if (el.variableKey === "{{class}}") contentStr = activeStudent?.classe ? `Classe: ${activeStudent.classe}` : "Classe: 6ème A";
            else if (el.variableKey === "{{section}}") contentStr = activeStudent?.section || "Général";
            else if (el.variableKey === "{{gender}}") contentStr = activeStudent?.sexe || "Masculin";
            else if (el.variableKey === "{{birth_date}}") contentStr = activeStudent?.dateNaissance || "14/05/2012";
            else if (el.variableKey === "{{birth_place}}") contentStr = activeStudent?.lieuNaissance || "Maradi";
            else if (el.variableKey === "{{blood_type}}") contentStr = activeStudent?.groupeSanguin || "O+";
            else if (el.variableKey === "{{phone}}") contentStr = activeStudent?.whatsapp || activeStudent?.mobile || activeStudent?.phoneFixe || activeStudent?.telTuteur || activeStudent?.telephone || "+227 90 00 00 00";
            else if (el.variableKey === "{{guardian}}") contentStr = activeStudent?.nomPere || activeStudent?.tuteur || "Parent d'élève";
            else if (el.variableKey === "{{address}}") contentStr = activeStudent?.adresse || "Maradi, République du Niger";
            else if (el.variableKey === "{{school_name}}") {
              const rawBranchName = activeBranch?.nomBranch || activeBranch?.branchName || activeBranch?.name || "";
              const isGeneric = !rawBranchName || rawBranchName.toLowerCase().includes("école gestion") || rawBranchName.toLowerCase().includes("ecole gestion") || rawBranchName.toLowerCase().includes("main") || rawBranchName.toLowerCase().includes("principal");
              let cachedSchoolName = "";
              if (typeof window !== "undefined") {
                try {
                  const u = JSON.parse(localStorage.getItem("edut_user_session") || "{}");
                  cachedSchoolName = u?.school?.name || "";
                } catch {}
              }
              contentStr = (!isGeneric ? rawBranchName : cachedSchoolName) || "CES BOURJA MARADI";
            }
            else if (el.variableKey === "{{academic_year}}") contentStr = "2025-2026";
            else if (el.variableKey === "{{director}}") contentStr = activeBranch?.directorName || "Le Directeur Général";
            else if (el.variableKey === "{{school_phone}}") contentStr = activeBranch?.telephone || activeBranch?.contactNo || "+227 90 00 00 00";
            else if (el.variableKey === "{{school_email}}") contentStr = activeBranch?.email || "contact@ces-bourja.ne";
            else if (el.variableKey === "{{issue_date}}") contentStr = new Date().toLocaleDateString("fr-FR");
            else if (el.variableKey === "{{expiry_date}}") contentStr = "31/07/2026";
            else if (el.variableKey === "{{status_badge}}") contentStr = "ÉLÈVE RÉGULIER";
            else if (el.variableKey === "{{qr_code}}") {
              contentStr = activeStudent
                ? JSON.stringify({
                    type: "student_pass",
                    student_id: activeStudent.id,
                    num_admission: activeStudent.numAdmission || `ID-${activeStudent.id}`,
                    nom_etudiant: `${activeStudent.nomEtudiant || ""} ${activeStudent.prenomEtudiant || ""}`.trim(),
                    classe: activeStudent.classe || "",
                  })
                : "EDUT-CARD-VERIFIED";
            }
            else if (el.variableKey === "{{barcode}}") contentStr = activeStudent?.numAdmission || "BRJ-2027-0001";
          }

          let rawPhoto = activeStudent?.photoPath || el.src;
          if (rawPhoto && (rawPhoto.startsWith("C:") || rawPhoto.startsWith("file:"))) {
            rawPhoto = `/api/files?path=${encodeURIComponent(rawPhoto)}`;
          }
          const photoSrc = rawPhoto;

          let rawLogo = activeBranch?.logoPath || el.src;
          if (rawLogo && (rawLogo.startsWith("C:") || rawLogo.startsWith("file:"))) {
            rawLogo = `/api/files?path=${encodeURIComponent(rawLogo)}`;
          }
          const logoSrc = rawLogo;

          return (
            <div
              key={el.id}
              onPointerDown={readOnly ? undefined : (e) => handlePointerDown(e, el)}
              style={{
                position: "absolute",
                left: el.x * scale,
                top: el.y * scale,
                width: el.width * scale,
                height: el.height * scale,
                transform: `rotate(${el.rotation || 0}deg)`,
                opacity: el.opacity ?? 1,
                zIndex: el.zIndex,
              }}
              className={
                readOnly
                  ? ""
                  : `group cursor-move transition-shadow ${
                      isSelected ? "ring-2 ring-indigo-600 ring-offset-2" : "hover:ring-1 hover:ring-indigo-300"
                    }`
              }
            >
              {/* Element Content Box */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  fontFamily: el.fontFamily || "Poppins",
                  fontSize: (el.fontSize || 12) * scale,
                  fontWeight: el.fontWeight || "normal",
                  fontStyle: el.fontStyle || "normal",
                  textDecoration: el.textDecoration || "none",
                  textTransform: el.textTransform || "none",
                  textAlign: el.textAlign || "left",
                  color: el.color || "#111827",
                  backgroundColor: el.backgroundColor || "transparent",
                  backgroundImage: el.bgGradient || "none",
                  borderColor: el.borderColor || "transparent",
                  borderWidth: (el.borderWidth || 0) * scale,
                  borderRadius: (el.borderRadius || 0) * scale,
                  borderStyle: el.borderStyle || "solid",
                  letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : "normal",
                  lineHeight: el.lineHeight || 1.2,
                  boxShadow: el.boxShadowEnabled
                    ? `${el.boxShadowOffsetX || 0}px ${el.boxShadowOffsetY || 2}px ${el.boxShadowBlur || 4}px ${el.boxShadowColor || "rgba(0,0,0,0.15)"}`
                    : "none",
                }}
                className="overflow-hidden flex items-center"
              >
                {el.type === "text" || el.type === "variable" ? (
                  <span className="w-full break-words">{contentStr}</span>
                ) : el.type === "studentPhoto" ? (
                  photoSrc && !photoSrc.includes("placeholder-student") ? (
                    <img
                      src={photoSrc}
                      alt={el.name}
                      className={`w-full h-full object-cover pointer-events-none ${el.circularCrop ? "rounded-full" : ""}`}
                    />
                  ) : (
                    <div className={`w-full h-full bg-slate-100 border-2 border-indigo-200 text-indigo-600 flex flex-col items-center justify-center p-1 ${el.circularCrop ? "rounded-full" : "rounded-lg"}`}>
                      <User size={24 * scale} />
                      <span className="text-[7px] font-bold text-center mt-1 text-slate-500">Photo Élève</span>
                    </div>
                  )
                ) : el.type === "schoolLogo" ? (
                  logoSrc && !logoSrc.includes("placeholder-logo") ? (
                    <img
                      src={logoSrc}
                      alt={el.name}
                      className={`w-full h-full object-contain pointer-events-none ${el.circularCrop ? "rounded-full" : ""}`}
                    />
                  ) : (
                    <div className="w-full h-full bg-indigo-900/10 text-indigo-700 border border-indigo-300 flex flex-col items-center justify-center rounded-lg p-0.5">
                      <Building2 size={20 * scale} />
                      <span className="text-[6px] font-black text-center uppercase tracking-tighter">Logo École</span>
                    </div>
                  )
                ) : el.type === "image" ? (
                  el.src ? (
                    <img
                      src={el.src}
                      alt={el.name}
                      className={`w-full h-full object-cover pointer-events-none ${el.circularCrop ? "rounded-full" : ""}`}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 text-slate-500 border border-slate-300 flex items-center justify-center rounded p-1">
                      <ImageIcon size={18 * scale} />
                    </div>
                  )
                ) : el.type === "badge" || el.type === "watermark" ? (
                  <span className="w-full text-center font-bold">{contentStr}</span>
                ) : el.type === "shape" ? (
                  <div
                    style={{ borderRadius: el.shapeType === "circle" ? "50%" : el.borderRadius || 0 }}
                    className="w-full h-full"
                  />
                ) : el.type === "qrcode" ? (
                  <div className="w-full h-full bg-white border border-slate-200 flex flex-col items-center justify-center rounded-lg p-1 shadow-sm">
                    <QRCodeSVG
                      value={contentStr || "EDUT-QR"}
                      size={Math.max(18, Math.min(el.width, el.height) * scale - 8 * scale)}
                      level="M"
                    />
                  </div>
                ) : el.type === "barcode" ? (
                  <div className="w-full h-full bg-white/95 border border-slate-200 rounded-md flex flex-col items-center justify-center px-1.5 py-0.5">
                    <div className="w-full flex items-center justify-between gap-[1px] h-[65%] overflow-hidden">
                      {Array.from({ length: 34 }).map((_, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: idx % 4 === 0 ? 2.5 * scale : idx % 2 === 0 ? 1.5 * scale : 1 * scale,
                            height: "100%",
                            backgroundColor: "#0f172a",
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[6.5px] font-mono font-bold tracking-widest text-slate-800 truncate mt-0.5">
                      {contentStr || "BRJ-2027-0001"}
                    </span>
                  </div>
                ) : el.type === "icon" ? (
                  <div className="flex items-center justify-center w-full h-full text-indigo-600">
                    {renderIcon(el.iconName)}
                  </div>
                ) : el.type === "signature" || el.type === "stamp" ? (
                  <div className="w-full h-full border-2 border-dashed border-indigo-400 bg-indigo-50/50 rounded flex flex-col items-center justify-center text-indigo-700 font-bold p-1">
                    <ShieldCheck size={16 * scale} />
                    <span className="text-[8px] font-black uppercase">{contentStr}</span>
                  </div>
                ) : null}
              </div>

              {/* Selection Transform Handles */}
              {isSelected && !el.locked && (
                <>
                  <div
                    onPointerDown={(e) => handleRotateStart(e, el)}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
                    title="Faire pivoter"
                  >
                    <RotateCw size={10} />
                  </div>

                  {["nw", "n", "ne", "e", "se", "s", "sw", "w"].map((h) => {
                    const positions: Record<string, string> = {
                      nw: "-top-1 -left-1 cursor-nwse-resize",
                      n: "-top-1 left-1/2 -translate-x-1/2 cursor-ns-resize",
                      ne: "-top-1 -right-1 cursor-nesw-resize",
                      e: "top-1/2 -right-1 -translate-y-1/2 cursor-ew-resize",
                      se: "-bottom-1 -right-1 cursor-nwse-resize",
                      s: "-bottom-1 left-1/2 -translate-x-1/2 cursor-ns-resize",
                      sw: "-bottom-1 -left-1 cursor-nesw-resize",
                      w: "top-1/2 -left-1 -translate-y-1/2 cursor-ew-resize",
                    };

                    return (
                      <div
                        key={h}
                        onPointerDown={(e) => handleResizeStart(e, el, h)}
                        className={`absolute w-2.5 h-2.5 bg-white border-2 border-indigo-600 rounded-full shadow z-30 ${positions[h]}`}
                      />
                    );
                  })}
                </>
              )}

              {/* Lock Badge */}
              {el.locked && isSelected && (
                <div className="absolute -top-2.5 -right-2.5 p-0.5 bg-amber-500 text-white rounded-full shadow">
                  <Lock size={10} />
                </div>
              )}
            </div>
          );
        })}
    </div>
  );

  if (readOnly) {
    return sheetContent;
  }

  return (
    <div className="relative flex-1 overflow-auto bg-slate-200/80 dark:bg-[#08090f] p-8 flex items-center justify-center select-none" onClick={() => onSelect(null)}>
      {sheetContent}
    </div>
  );
}
