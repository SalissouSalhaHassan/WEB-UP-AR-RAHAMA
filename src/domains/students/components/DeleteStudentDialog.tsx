"use client";

import React, { useState } from "react";
import { 
  Trash2, 
  AlertTriangle, 
  Loader2, 
  FileText, 
  UserX, 
  HelpCircle,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const PREDEFINED_REASONS = [
  { id: "transfer", label: "Transfert vers un autre établissement" },
  { id: "abandon", label: "Abandon scolaire / Démission" },
  { id: "relocation", label: "Déménagement de la famille" },
  { id: "financial", label: "Difficultés financières / Non-paiement" },
  { id: "disciplinary", label: "Exclusion disciplinaire" },
  { id: "duplicate", label: "Doublon / Erreur de saisie" },
  { id: "other", label: "Autre motif spécifique" },
];

interface DeleteStudentDialogProps {
  open: boolean;
  onClose: () => void;
  student: {
    id: number;
    nomEtudiant?: string;
    numAdmission?: string;
    classe?: string;
  } | null;
  onConfirm: (reason: string) => Promise<{ success?: boolean; error?: string }>;
}

export function DeleteStudentDialog({
  open,
  onClose,
  student,
  onConfirm,
}: DeleteStudentDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  if (!student) return null;

  const handleClose = () => {
    if (isDeleting) return;
    setSelectedReason("");
    setCustomReason("");
    setErrorMsg("");
    onClose();
  };

  const effectiveReason =
    selectedReason === "other"
      ? customReason.trim()
      : selectedReason
      ? PREDEFINED_REASONS.find((r) => r.id === selectedReason)?.label || ""
      : "";

  const canSubmit = effectiveReason.trim().length >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setErrorMsg("Veuillez obligatoirement sélectionner ou préciser le motif de suppression.");
      return;
    }

    setIsDeleting(true);
    setErrorMsg("");

    try {
      const res = await onConfirm(effectiveReason);
      if (res.success) {
        handleClose();
      } else {
        setErrorMsg(res.error || "Une erreur est survenue lors de la suppression.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur réseau.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); }}>
      <DialogContent className="max-w-md rounded-[2.5rem] p-0 border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131622] shadow-2xl overflow-hidden">
        {/* Header with warning banner */}
        <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent p-6 pb-4 border-b border-rose-100 dark:border-rose-950/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-inner">
              <UserX size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white">
                  Zone Critique
                </span>
                <span className="text-slate-400 text-xs font-mono">
                  #{student.numAdmission || `ID-${student.id}`}
                </span>
              </div>
              <DialogTitle className="text-xl font-black text-slate-900 dark:text-white truncate mt-1">
                Supprimer le dossier élève
              </DialogTitle>
            </div>
          </div>

          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium leading-relaxed">
            Vous êtes sur le point de supprimer le dossier de{" "}
            <strong className="text-slate-800 dark:text-slate-200 font-bold">
              {student.nomEtudiant}
            </strong>{" "}
            ({student.classe || "Non assigné"}).
          </DialogDescription>
        </div>

        {/* Body & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Motif de suppression (Obligatoire) *</span>
              <span className="text-[10px] text-rose-500 font-bold">Requis</span>
            </Label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Ce motif sera consigné dans le journal d'audit et les archives administratives.
            </p>

            <div className="space-y-1.5 pt-1">
              {PREDEFINED_REASONS.map((reason) => {
                const isSelected = selectedReason === reason.id;
                return (
                  <label
                    key={reason.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      isSelected
                        ? "bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="deleteReason"
                      value={reason.id}
                      checked={isSelected}
                      onChange={() => {
                        setSelectedReason(reason.id);
                        setErrorMsg("");
                      }}
                      className="accent-rose-600 h-3.5 w-3.5"
                    />
                    <span className="flex-1">{reason.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Custom Reason Field if 'other' is selected */}
          {selectedReason === "other" && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Précisez le motif détaillé *
              </Label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Ex: Départ à l'étranger suite à mutation professionnelle des parents..."
                rows={3}
                required
                className="w-full text-xs p-3 rounded-xl border border-rose-200 dark:border-rose-950/50 bg-rose-50/30 dark:bg-rose-950/20 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none font-medium"
              />
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isDeleting}
              className="rounded-xl px-5 h-11 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || isDeleting}
              className="rounded-xl px-6 h-11 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 gap-2 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Suppression en cours...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Confirmer la suppression
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
