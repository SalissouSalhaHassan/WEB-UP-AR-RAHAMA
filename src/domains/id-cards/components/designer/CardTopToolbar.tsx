"use client";

import { useRef } from "react";
import { CardSize, Orientation, CardSide } from "./types";
import { SMART_CARD_PRESETS, SmartCardPreset } from "./cardSmartPresets";
import { Undo, Redo, ZoomIn, ZoomOut, Download, Upload, Save, Printer, IdCard, Sparkles, Grid, Ruler, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CardTopToolbarProps {
  cardType: CardSize;
  onCardTypeChange: (size: CardSize) => void;
  orientation: Orientation;
  onOrientationChange: (orientation: Orientation) => void;
  activeSide: CardSide;
  onSideChange: (side: CardSide) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showRulers: boolean;
  onToggleRulers: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExport: (format: "pdf" | "png" | "jpeg" | "json") => void;
  onImportJSON: (json: any) => void;
  onSave: () => void;
  saving?: boolean;
  templateName: string;
  onTemplateNameChange: (name: string) => void;
  onBatchPrintClick: () => void;
  students?: any[];
  previewStudentId?: number | null;
  onPreviewStudentChange?: (id: number) => void;
  onApplyPreset?: (preset: SmartCardPreset) => void;
}

export default function CardTopToolbar({
  cardType,
  onCardTypeChange,
  orientation,
  onOrientationChange,
  activeSide,
  onSideChange,
  zoom,
  onZoomChange,
  showGrid,
  onToggleGrid,
  showRulers,
  onToggleRulers,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onExport,
  onImportJSON,
  onSave,
  saving,
  templateName,
  onTemplateNameChange,
  onBatchPrintClick,
  students,
  previewStudentId,
  onPreviewStudentChange,
  onApplyPreset,
}: CardTopToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onImportJSON(json);
      } catch (err) {
        alert("Fichier JSON non valide");
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="min-h-14 py-2 bg-white dark:bg-[#131622] border-b border-slate-200 dark:border-slate-800 px-4 flex flex-wrap items-center justify-between gap-2 z-30 shadow-sm select-none text-slate-900 dark:text-white">
      {/* Template Name & Side Switcher */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
            <IdCard size={18} />
          </div>
          <div>
            <input
              type="text"
              value={templateName}
              onChange={(e) => onTemplateNameChange(e.target.value)}
              className="text-xs font-black text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-600 focus:outline-none transition px-1 w-44"
              placeholder="Nom du modèle de carte..."
            />
            <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-400 px-1">Studio de cartes ID (WYSIWYG)</p>
          </div>
        </div>

        {/* Quick Preset Switcher */}
        {onApplyPreset && (
          <Select
            onValueChange={(presetId) => {
              const found = SMART_CARD_PRESETS.find((p) => p.id === presetId);
              if (found) onApplyPreset(found);
            }}
          >
            <SelectTrigger className="h-8 w-44 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-black text-[11px] shadow-sm">
              <Palette size={13} className="mr-1 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <SelectValue placeholder="Changer de Modèle..." />
            </SelectTrigger>
            <SelectContent>
              {SMART_CARD_PRESETS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.badge})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Recto / Verso Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => onSideChange("recto")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${
              activeSide === "recto" ? "bg-indigo-600 text-white shadow" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Recto (Face)
          </button>
          <button
            onClick={() => onSideChange("verso")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${
              activeSide === "verso" ? "bg-indigo-600 text-white shadow" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Verso (Dos)
          </button>
        </div>

        {/* Live Student Data Preview Selector */}
        {students && students.length > 0 && onPreviewStudentChange && (
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-900/60 px-2 py-0.5 rounded-xl">
            <Sparkles size={12} className="text-amber-600 dark:text-amber-400" />
            <span className="text-[9px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-tight">Élève :</span>
            <Select value={String(previewStudentId || students[0]?.id)} onValueChange={(val) => onPreviewStudentChange(Number(val))}>
              <SelectTrigger className="h-7 w-36 rounded-lg border-none bg-white dark:bg-slate-900 font-bold text-[11px] shadow-sm text-slate-900 dark:text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {students.map((st) => (
                  <SelectItem key={st.id} value={String(st.id)}>
                    {st.nomEtudiant} {st.prenomEtudiant} ({st.classe || "N/A"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Card Configuration & Controls */}
      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
        <Select value={cardType} onValueChange={(v) => onCardTypeChange(v as CardSize)}>
          <SelectTrigger className="h-7 w-24 rounded-xl border-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-[11px] shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CR80">CR80 (PVC)</SelectItem>
            <SelectItem value="CR100">CR100 (Grand)</SelectItem>
            <SelectItem value="Badge">Badge (90x60)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={orientation} onValueChange={(v) => onOrientationChange(v as Orientation)}>
          <SelectTrigger className="h-7 w-24 rounded-xl border-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-[11px] shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="landscape">Paysage</SelectItem>
            <SelectItem value="portrait">Vertical</SelectItem>
          </SelectContent>
        </Select>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

        <Button size="icon" variant="ghost" disabled={!canUndo} onClick={onUndo} className="h-7 w-7 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800" title="Annuler (Ctrl+Z)">
          <Undo size={13} />
        </Button>
        <Button size="icon" variant="ghost" disabled={!canRedo} onClick={onRedo} className="h-7 w-7 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800" title="Rétablir (Ctrl+Y)">
          <Redo size={13} />
        </Button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

        <div className="flex items-center gap-0.5">
          <Button size="icon" variant="ghost" onClick={() => onZoomChange(Math.max(25, zoom - 25))} className="h-7 w-7 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800">
            <ZoomOut size={13} />
          </Button>
          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 w-9 text-center">{zoom}%</span>
          <Button size="icon" variant="ghost" onClick={() => onZoomChange(Math.min(200, zoom + 25))} className="h-7 w-7 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800">
            <ZoomIn size={13} />
          </Button>
        </div>

        <Button size="icon" variant="ghost" onClick={onToggleGrid} className={`h-7 w-7 rounded-xl ${showGrid ? "bg-indigo-600 text-white" : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"}`} title="Grille">
          <Grid size={13} />
        </Button>
      </div>

      {/* Export & Actions */}
      <div className="flex items-center gap-1.5">
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} className="hidden" />

        <Button onClick={onBatchPrintClick} className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1">
          <Printer size={13} /> Imprimer Lots
        </Button>

        <Select onValueChange={(fmt) => onExport(fmt as any)}>
          <SelectTrigger className="h-8 w-24 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold text-[11px] shadow-sm">
            <Download size={12} className="mr-1 text-slate-500 dark:text-slate-400" />
            <SelectValue placeholder="Export" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pdf">PDF (300 DPI)</SelectItem>
            <SelectItem value="png">PNG HD</SelectItem>
            <SelectItem value="jpeg">JPEG</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={onSave} disabled={saving} className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] shadow-sm flex items-center gap-1">
          <Save size={13} /> {saving ? "..." : "Sauvegarder"}
        </Button>
      </div>
    </header>
  );
}
