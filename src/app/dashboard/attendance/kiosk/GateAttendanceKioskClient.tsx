"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  ShieldCheck, AlertTriangle, QrCode, Camera, Volume2, VolumeX, 
  Maximize, Minimize, ArrowLeft, Users, Clock, CheckCircle2, 
  Smartphone, User, RefreshCw, X, Sparkles, Send 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { recordGateScanAction, getGateTodayStatsAction } from "@/domains/attendance/actions/kiosk.actions";

interface GateAttendanceKioskClientProps {
  initialStats?: {
    totalScanned: number;
    onTimeCount: number;
    lateCount: number;
  };
}

export default function GateAttendanceKioskClient({ initialStats }: GateAttendanceKioskClientProps) {
  const [identifier, setIdentifier] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState(initialStats || { totalScanned: 0, onTimeCount: 0, lateCount: 0 });
  const [recentScans, setRecentScans] = useState<any[]>([]);
  
  // Last scan banner display
  const [lastScan, setLastScan] = useState<any | null>(null);

  // Kiosk Settings
  const [lateCutoff, setLateCutoff] = useState("08:15");
  const [notifyParentWhatsApp, setNotifyParentWhatsApp] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  // Keep clock running
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keep focus on input for USB barcode / QR scanners
  useEffect(() => {
    const focusInput = () => {
      if (document.activeElement?.tagName !== "INPUT" && inputRef.current) {
        inputRef.current.focus();
      }
    };
    focusInput();
    const clickHandler = () => focusInput();
    window.addEventListener("click", clickHandler);
    return () => window.removeEventListener("click", clickHandler);
  }, []);

  // Beep sound feedback
  const playSound = (isSuccess: boolean, isLate: boolean) => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess && !isLate) {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch pleasant beep
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (isLate) {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime); // Low buzz
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      // Audio context may require prior user interaction
    }
  };

  const handleScanSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const idToScan = identifier.trim();
    if (!idToScan || isProcessing) return;

    setIsProcessing(true);
    setIdentifier("");

    try {
      const res = await recordGateScanAction({
        identifier: idToScan,
        lateCutoffTime: lateCutoff,
        notifyParent: notifyParentWhatsApp,
      });

      if (res.success && res.student) {
        const student = res.student;
        const isLate = student.status === "En Retard";
        playSound(true, isLate);

        setLastScan(student);
        setRecentScans((prev) => [student, ...prev.slice(0, 7)]);
        
        // Update counters
        setStats((prev) => ({
          totalScanned: prev.totalScanned + 1,
          onTimeCount: prev.onTimeCount + (isLate ? 0 : 1),
          lateCount: prev.lateCount + (isLate ? 1 : 0),
        }));

        if (isLate) {
          toast.warning(`Retard enregistré : ${student.nomEtudiant} (${student.entryTime})`);
        } else {
          toast.success(`Entrée autorisée : ${student.nomEtudiant} (${student.entryTime})`);
        }
      } else {
        playSound(false, false);
        setLastScan({
          nomEtudiant: "Badge Inconnu / Non Autorisé",
          numAdmission: idToScan,
          classe: "—",
          status: "Non Autorisé",
          entryTime: currentTime,
        });
        toast.error(res.error || "Badge non reconnu");
      }
    } catch (error) {
      playSound(false, false);
      toast.error("Erreur de pointage");
    } finally {
      setIsProcessing(false);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D13] text-white flex flex-col justify-between p-4 sm:p-6 select-none font-sans">
      {/* 1. Kiosk Top Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/attendance"
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Quitter le mode Kiosk"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Borne de Pointage Portail</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Mode Kiosk Actif
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Contrôle d&apos;accès automatique par Badge, QR Code et Barcode
            </p>
          </div>
        </div>

        {/* Live Clock & Controls */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-2xl font-mono font-black text-indigo-400 tracking-wider">
              {currentTime || "08:00:00"}
            </span>
            <p className="text-[10px] text-slate-500 font-bold uppercase">
              Heure limite : {lateCutoff}
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl transition ${soundEnabled ? "text-indigo-400 hover:bg-indigo-500/10" : "text-slate-600 hover:bg-slate-800"}`}
              title={soundEnabled ? "Désactiver le son" : "Activer le son"}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Plein Écran"
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Middle Main Section: Big Scan Display & Turnstile Counters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-auto py-6">
        
        {/* Left Col: Turnstile Counters & Kiosk Settings */}
        <div className="space-y-4">
          <div className="bg-[#141721] border border-slate-800/80 rounded-3xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Users size={16} className="text-indigo-400" />
              Statistiques d&apos;Entrée du Jour
            </h3>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Total Entrants</span>
                <p className="text-2xl font-black text-white mt-0.5">{stats.totalScanned}</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl">
                <span className="text-[10px] text-emerald-400 font-bold uppercase">À l&apos;heure</span>
                <p className="text-2xl font-black text-emerald-400 mt-0.5">{stats.onTimeCount}</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl">
                <span className="text-[10px] text-amber-400 font-bold uppercase">En Retard</span>
                <p className="text-2xl font-black text-amber-400 mt-0.5">{stats.lateCount}</p>
              </div>
            </div>
          </div>

          {/* Kiosk Options */}
          <div className="bg-[#141721] border border-slate-800/80 rounded-3xl p-5 space-y-4 text-xs">
            <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
              Paramètres Rapides du Portail
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Heure de Tolérance (Retard) :</span>
                <input
                  type="time"
                  value={lateCutoff}
                  onChange={(e) => setLateCutoff(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white font-bold rounded-lg px-2 py-1 text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Smartphone size={14} className="text-emerald-400" />
                  Alerte WhatsApp Parent :
                </span>
                <button
                  type="button"
                  onClick={() => setNotifyParentWhatsApp(!notifyParentWhatsApp)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${notifyParentWhatsApp ? "bg-emerald-600" : "bg-slate-800"}`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${notifyParentWhatsApp ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Center Col: Big Visual Scan Feedback Card */}
        <div className="lg:col-span-2 flex flex-col justify-center">
          {lastScan ? (
            <div
              className={`rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all duration-300 animate-in zoom-in-95 ${
                lastScan.status === "Présent"
                  ? "bg-gradient-to-br from-emerald-950/80 via-[#141721] to-slate-900 border-emerald-500/50 shadow-emerald-500/10"
                  : lastScan.status === "En Retard"
                  ? "bg-gradient-to-br from-amber-950/80 via-[#141721] to-slate-900 border-amber-500/50 shadow-amber-500/10"
                  : "bg-gradient-to-br from-rose-950/80 via-[#141721] to-slate-900 border-rose-500/50 shadow-rose-500/10"
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Student Photo */}
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-slate-900 border-2 border-white/20 overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
                  {lastScan.photoUrl ? (
                    <img
                      src={lastScan.photoUrl}
                      alt={lastScan.nomEtudiant}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={64} className="text-slate-500" />
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2 text-center sm:text-left flex-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      lastScan.status === "Présent"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : lastScan.status === "En Retard"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    {lastScan.status === "Présent" && <CheckCircle2 size={14} />}
                    {lastScan.status === "En Retard" && <Clock size={14} />}
                    {lastScan.status === "Non Autorisé" && <AlertTriangle size={14} />}
                    {lastScan.status === "Présent"
                      ? "Accès Autorisé • À l'heure"
                      : lastScan.status === "En Retard"
                      ? "Accès Autorisé • En Retard"
                      : "Accès Refusé • Badge Inconnu"}
                  </span>

                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {lastScan.nomEtudiant}
                  </h2>

                  <p className="text-slate-300 text-sm font-semibold">
                    Classe : <span className="text-white font-black">{lastScan.classe}</span> • Matricule : <span className="font-mono text-indigo-300">{lastScan.numAdmission}</span>
                  </p>

                  <div className="flex items-center justify-center sm:justify-start gap-4 pt-2">
                    <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Heure de Pointage</span>
                      <span className="text-base font-black font-mono text-white">{lastScan.entryTime}</span>
                    </div>

                    {lastScan.parentNotified && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl font-bold">
                        <Smartphone size={14} />
                        Parent Notifié WhatsApp
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Idle Screen Waiting for Scan */
            <div className="rounded-3xl p-10 border border-slate-800 bg-[#141721] text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto animate-pulse">
                <QrCode size={40} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">Prêt pour le Scan</h3>
                <p className="text-slate-400 text-xs max-w-md mx-auto">
                  Présentez le badge élève, le code-barres ou le QR Code devant la douchette ou la caméra.
                </p>
              </div>
            </div>
          )}

          {/* Scanner Input Form (Keeps auto-focus for barcode gun) */}
          <form onSubmit={handleScanSubmit} className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Scanner le badge ou taper le matricule (ex: AM-2026-0001)..."
                className="h-14 bg-slate-900/90 border-slate-700 text-white font-mono font-bold text-base pl-12 rounded-2xl focus:border-indigo-500"
                autoFocus
              />
              <QrCode size={20} className="absolute left-4 top-4 text-slate-500" />
            </div>

            <Button
              type="submit"
              disabled={isProcessing || !identifier.trim()}
              className="h-14 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-600/20 shrink-0"
            >
              {isProcessing ? <RefreshCw className="animate-spin" size={20} /> : "Valider"}
            </Button>
          </form>
        </div>
      </div>

      {/* 3. Bottom Row: Recent Scans Stream */}
      <div className="border-t border-slate-800/80 pt-4">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Clock size={13} />
          Derniers Élèves Pointés au Portail
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {recentScans.map((s, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-xl border text-[11px] flex flex-col justify-between ${
                s.status === "Présent"
                  ? "bg-slate-900/60 border-emerald-500/30 text-emerald-300"
                  : "bg-slate-900/60 border-amber-500/30 text-amber-300"
              }`}
            >
              <p className="font-black truncate text-white">{s.nomEtudiant.split(" ")[0]}</p>
              <div className="flex justify-between items-center text-[9px] text-slate-400 mt-1">
                <span>{s.classe}</span>
                <span className="font-mono font-bold">{s.entryTime}</span>
              </div>
            </div>
          ))}
          {recentScans.length === 0 && (
            <div className="col-span-full text-slate-600 text-xs py-2 italic text-center">
              Aucun pointage récent. En attente des premiers arrivants...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
