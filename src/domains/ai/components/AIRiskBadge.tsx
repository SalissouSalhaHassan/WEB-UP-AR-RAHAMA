"use client";

import React, { useState } from "react";
import { 
  ShieldAlert, AlertTriangle, CheckCircle, Info, Sparkles, 
  X, Phone, MessageSquare, UserCheck, Calendar, BookOpen 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface AIRiskBadgeProps {
  studentId: number;
  studentName: string;
  riskScore: number; // 0 to 100
  riskLevel: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  absenceRate?: number;
  averageGrade?: number;
  primaryRiskFactorFr?: string;
  primaryRiskFactorAr?: string;
  aiRecommendationFr?: string;
  aiRecommendationAr?: string;
  showDetailsOnClick?: boolean;
}

export function AIRiskBadge({
  studentId,
  studentName,
  riskScore,
  riskLevel,
  absenceRate = 0,
  averageGrade = 12,
  primaryRiskFactorFr = "Indicateurs réguliers",
  primaryRiskFactorAr = "مؤشرات طبيعية ومستقرة",
  aiRecommendationFr = "Poursuivre le suivi pédagogique habituel.",
  aiRecommendationAr = "مواصلة المتابعة التربوية الاعتيادية.",
  showDetailsOnClick = true,
}: AIRiskBadgeProps) {
  const [showModal, setShowModal] = useState(false);

  const isCritical = riskLevel === "CRITICAL" || riskScore >= 75;
  const isHigh = riskLevel === "HIGH" || (riskScore >= 50 && riskScore < 75);
  const isModerate = riskLevel === "MODERATE" || (riskScore >= 30 && riskScore < 50);

  const badgeConfig = isCritical
    ? {
        label: "Risque Critique",
        labelAr: "خطر حرج",
        colorClass: "bg-red-500/15 border-red-500/40 text-red-300 hover:bg-red-500/25",
        icon: ShieldAlert,
        dotColor: "bg-red-500",
      }
    : isHigh
    ? {
        label: "Risque Élevé",
        labelAr: "خطر مرتفع",
        colorClass: "bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25",
        icon: AlertTriangle,
        dotColor: "bg-amber-500",
      }
    : isModerate
    ? {
        label: "Risque Modéré",
        labelAr: "خطر معتدل",
        colorClass: "bg-yellow-500/15 border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/25",
        icon: Info,
        dotColor: "bg-yellow-400",
      }
    : {
        label: "Risque Faible",
        labelAr: "مستقر / منخفض",
        colorClass: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25",
        icon: CheckCircle,
        dotColor: "bg-emerald-400",
      };

  const IconComp = badgeConfig.icon;

  const handleAction = (type: string) => {
    if (type === "whatsapp") {
      toast.success(`Alerte de prévention envoyée via WhatsApp pour ${studentName}`);
    } else if (type === "tutorat") {
      toast.success(`Plan de tutorat et soutien activé pour ${studentName}`);
    } else if (type === "convocation") {
      toast.success(`Convocation officielle générée pour le tuteur de ${studentName}`);
    }
    setShowModal(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => showDetailsOnClick && setShowModal(true)}
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold transition-all shadow-sm ${badgeConfig.colorClass}`}
        title="Cliquer pour afficher le diagnostic IA complet"
      >
        <span className={`w-2 h-2 rounded-full ${badgeConfig.dotColor} animate-pulse`} />
        <IconComp size={13} />
        <span>{badgeConfig.label} ({riskScore}%)</span>
      </button>

      {/* AI Diagnostic Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1F222B] border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-white space-y-6 relative">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  isCritical
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : isHigh
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                <Sparkles size={24} />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                  Diagnostic Prédictif IA • التنبؤ بالرسوب والتسرب
                </span>
                <h3 className="text-lg font-black text-white">{studentName}</h3>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${badgeConfig.colorClass}`}>
                    {badgeConfig.label} — Score: {riskScore}/100
                  </span>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Taux d&apos;Absence</span>
                <p className={`text-xl font-black mt-1 ${absenceRate > 20 ? "text-red-400" : "text-white"}`}>
                  {absenceRate.toFixed(1)}%
                </p>
                <span className="text-[10px] text-slate-500">Sur les 30 derniers jours</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Moyenne Actuelle</span>
                <p className={`text-xl font-black mt-1 ${averageGrade < 10 ? "text-red-400" : "text-white"}`}>
                  {averageGrade.toFixed(1)} / 20
                </p>
                <span className="text-[10px] text-slate-500">Seuil de validation: 10/20</span>
              </div>
            </div>

            {/* Root Causes */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Info size={14} className="text-indigo-400" />
                Cause Principale du Risque
              </h4>
              <p className="text-sm text-slate-200 font-medium leading-relaxed">
                {primaryRiskFactorFr}
              </p>
              <p className="text-xs text-slate-400 font-arabic dir-rtl text-right pt-1 border-t border-slate-800/50">
                {primaryRiskFactorAr}
              </p>
            </div>

            {/* AI Actionable Recommendations */}
            <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} />
                Recommandation de l&apos;IA pour l&apos;Administration
              </h4>
              <p className="text-sm text-indigo-100 font-medium leading-relaxed">
                {aiRecommendationFr}
              </p>
              <p className="text-xs text-indigo-300/80 font-arabic dir-rtl text-right pt-1 border-t border-indigo-500/20">
                {aiRecommendationAr}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => handleAction("tutorat")}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs h-10 gap-2"
              >
                <BookOpen size={14} />
                Planifier Tutorat
              </Button>
              <Button
                onClick={() => handleAction("whatsapp")}
                variant="outline"
                className="flex-1 border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs h-10 gap-2"
              >
                <MessageSquare size={14} className="text-emerald-400" />
                Alerter Tuteur (WhatsApp)
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
