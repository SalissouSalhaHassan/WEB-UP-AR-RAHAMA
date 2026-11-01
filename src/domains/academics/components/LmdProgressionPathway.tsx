"use client";

import React, { useState } from "react";
import { 
  GraduationCap, Award, BookOpen, CheckCircle2, AlertTriangle, Clock, 
  ChevronDown, ChevronUp, Sparkles, Printer, ShieldAlert, FileText, 
  Layers, Check, HelpCircle, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentLmdProgressionProfile, LmdSemesterItem, LmdUeItem } from "../services/lmd-progression.service";

interface LmdProgressionPathwayProps {
  profile: StudentLmdProgressionProfile;
}

export function LmdProgressionPathway({ profile }: LmdProgressionPathwayProps) {
  const [selectedSemester, setSelectedSemester] = useState<string>(profile.currentSemester || "S1");
  const [expandedSemesters, setExpandedSemesters] = useState<Record<string, boolean>>({
    [profile.currentSemester || "S1"]: true,
  });

  const toggleSemester = (semKey: string) => {
    setExpandedSemesters((prev) => ({
      ...prev,
      [semKey]: !prev[semKey],
    }));
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const currentSemObj = profile.semesters.find((s) => s.semester === selectedSemester) || profile.semesters[0];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Progression Bar */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold tracking-wide">
              <GraduationCap size={15} />
              Système LMD (Licence - Master - Doctorat)
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>{profile.programName}</span>
              <span className="text-sm font-semibold px-2.5 py-0.5 rounded-lg bg-indigo-500/30 border border-indigo-400/40 text-indigo-200">
                {profile.degreeLevel}
              </span>
            </h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl">
              {profile.facultyName} • {profile.departmentName}
            </p>
          </div>

          {/* Print Certificate Button */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="border-indigo-400/30 bg-indigo-900/30 hover:bg-indigo-900/60 text-indigo-200 rounded-xl gap-2 font-bold text-xs h-11"
            >
              <Printer size={15} />
              Imprimer Relevé LMD
            </Button>
          </div>
        </div>

        {/* Master Progress Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Capitalisation des Crédits ECTS
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black text-indigo-300">
                  {profile.totalCreditsAcquired}
                </span>
                <span className="text-slate-400 font-bold text-sm">
                  / {profile.totalCreditsRequired} Crédits ECTS
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-white">
                {profile.progressionPercentage}%
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                  profile.isGraduationEligible
                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                    : profile.academicDebts.length > 0
                    ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                    : "bg-blue-500/20 border border-blue-500/40 text-blue-300"
                }`}
              >
                {profile.statusLabelFr}
              </span>
            </div>
          </div>

          {/* Progress bar line */}
          <div className="w-full bg-slate-800/90 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                profile.isGraduationEligible
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                  : profile.academicDebts.length > 0
                  ? "bg-gradient-to-r from-amber-500 to-indigo-500"
                  : "bg-gradient-to-r from-indigo-500 to-blue-400"
              }`}
              style={{ width: `${Math.max(5, profile.progressionPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. AI Academic Guidance Card */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-slate-900/40 border border-indigo-500/20 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
          <Sparkles size={20} />
        </div>
        <div className="space-y-1.5 flex-1">
          <h4 className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
            <span>Diagnostic & Recommandation Académique LMD</span>
            <span className="text-slate-400 font-normal">| التوجيه الأكاديمي الذكي</span>
          </h4>
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            {profile.aiAcademicAdviceFr}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed font-arabic dir-rtl text-right pt-1 border-t border-slate-800/40">
            {profile.aiAcademicAdviceAr}
          </p>
        </div>
      </div>

      {/* 3. Academic Debts Alert Box (if any) */}
      {profile.academicDebts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-amber-200 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
            <AlertTriangle size={18} className="text-amber-400" />
            <span>Unités d&apos;Enseignement (UE) en Dette Académique ({profile.academicDebts.length})</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Ces matières doivent obligatoirement être présentées lors de la prochaine session de rattrapage ou au semestre équivalent de l&apos;année suivante pour valider le diplôme.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {profile.academicDebts.map((debt, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">{debt.codeUe}</span>
                  <p className="text-xs font-bold text-white line-clamp-1">{debt.nameUe}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="text-xs font-extrabold text-red-400">{debt.grade ? `${debt.grade}/20` : "Non validé"}</span>
                  <p className="text-[10px] text-slate-400">{debt.creditsEcts} ECTS</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Semester-by-Semester Roadmap */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-400" />
            Parcours Détaillé par Semestre
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {profile.semesters.length} Semestres au programme
          </span>
        </div>

        {/* Semesters Cards Accordion */}
        <div className="space-y-4">
          {profile.semesters.map((sem) => {
            const isExpanded = expandedSemesters[sem.semester];
            const isValidated = sem.decision === "ADMIS" || sem.decision === "ADMIS_COMPENSATION";
            const isInProgress = sem.decision === "EN_COURS";
            const isDebt = sem.decision === "ENJAMBEMENT" || sem.decision === "AJOURNE";

            return (
              <div
                key={sem.semester}
                className="bg-[#1F222B] border border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all"
              >
                {/* Semester Header Row */}
                <div
                  onClick={() => toggleSemester(sem.semester)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 select-none"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        isValidated
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : isDebt
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      }`}
                    >
                      {sem.semester}
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                        {sem.titleFr}
                        <span className="text-xs text-slate-400 font-normal">({sem.titleAr})</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        {sem.ues.length} Unités d&apos;Enseignement • {sem.creditsAcquired} / {sem.creditsTotal} ECTS Validés
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Average & Mention */}
                    {sem.semesterAverage !== null && (
                      <div className="text-right">
                        <span className="text-sm font-black text-white">{sem.semesterAverage} / 20</span>
                        {sem.mention && (
                          <p className="text-[10px] font-bold text-indigo-400">{sem.mention}</p>
                        )}
                      </div>
                    )}

                    {/* Decision Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isValidated
                          ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                          : isDebt
                          ? "bg-amber-500/15 border border-amber-500/30 text-amber-300"
                          : "bg-slate-700/50 text-slate-300"
                      }`}
                    >
                      {sem.decisionLabelFr}
                    </span>

                    <button className="text-slate-400 hover:text-white p-1">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expanded UE Details Table */}
                {isExpanded && (
                  <div className="p-5 pt-0 border-t border-slate-800/60 mt-1">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                            <th className="py-2.5 px-3">Code UE</th>
                            <th className="py-2.5 px-3">Intitulé de l&apos;Unité</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3 text-center">Crédits (ECTS)</th>
                            <th className="py-2.5 px-3 text-center">Coef</th>
                            <th className="py-2.5 px-3 text-center">Note / 20</th>
                            <th className="py-2.5 px-3 text-center">Résultat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {sem.ues.map((ue, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/20 text-slate-200">
                              <td className="py-3 px-3 font-mono font-bold text-indigo-300">{ue.codeUe}</td>
                              <td className="py-3 px-3 font-semibold text-white">{ue.nameUe}</td>
                              <td className="py-3 px-3 text-slate-400">{ue.typeUe}</td>
                              <td className="py-3 px-3 text-center font-bold text-indigo-200">{ue.creditsEcts}</td>
                              <td className="py-3 px-3 text-center text-slate-400">{ue.coefficient}</td>
                              <td className="py-3 px-3 text-center font-black">
                                {ue.grade !== null && ue.grade !== undefined ? (
                                  <span
                                    className={
                                      ue.grade >= 12
                                        ? "text-emerald-400"
                                        : ue.grade >= 10
                                        ? "text-indigo-300"
                                        : "text-red-400"
                                    }
                                  >
                                    {ue.grade.toFixed(1)}
                                  </span>
                                ) : (
                                  <span className="text-slate-500">—</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center">
                                {ue.status === "V" && (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-[10px]">
                                    Validé (V)
                                  </span>
                                )}
                                {ue.status === "VC" && (
                                  <span className="px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/30 text-blue-300 font-bold text-[10px]">
                                    Compensé (VC)
                                  </span>
                                )}
                                {ue.status === "RAT" && (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-[10px]">
                                    Rattrapage
                                  </span>
                                )}
                                {ue.status === "NV" && (
                                  <span className="px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-300 font-bold text-[10px]">
                                    Non Validé
                                  </span>
                                )}
                                {ue.status === "EN_COURS" && (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 font-semibold text-[10px]">
                                    En cours
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
