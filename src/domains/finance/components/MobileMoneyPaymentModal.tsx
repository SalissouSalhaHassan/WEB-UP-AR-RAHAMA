"use client";

import React, { useState, useTransition } from "react";
import { 
  Smartphone, CheckCircle2, Clock, ShieldCheck, X, AlertCircle, 
  Printer, Share2, ArrowRight, Loader2, DollarSign, QrCode, Phone 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  initiateMobileMoneyPaymentAction, 
  confirmMobileMoneyPaymentAction 
} from "../actions/mobile-money.actions";
import { DigitalReceiptData, MobileMoneyProvider } from "../services/mobile-money.service";

interface MobileMoneyPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  studentName: string;
  defaultAmount?: number;
  defaultPhone?: string;
  onPaymentSuccess?: (receipt: DigitalReceiptData) => void;
}

export function MobileMoneyPaymentModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  defaultAmount = 25000,
  defaultPhone = "",
  onPaymentSuccess,
}: MobileMoneyPaymentModalProps) {
  const [provider, setProvider] = useState<MobileMoneyProvider>("AIRTEL_MONEY");
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [phoneNumber, setPhoneNumber] = useState<string>(defaultPhone);
  const [purpose, setPurpose] = useState<string>("Frais de Scolarité");
  
  // Step state: "FORM" | "WAITING_CONFIRMATION" | "SUCCESS"
  const [step, setStep] = useState<"FORM" | "WAITING_CONFIRMATION" | "SUCCESS">("FORM");
  const [activeTxnRef, setActiveTxnRef] = useState<string>("");
  const [ussdInstruction, setUssdInstruction] = useState<string>("");
  const [receipt, setReceipt] = useState<DigitalReceiptData | null>(null);

  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleInitiate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      toast.error("Veuillez saisir un montant valide.");
      return;
    }
    if (!phoneNumber.trim()) {
      toast.error("Veuillez saisir un numéro de téléphone.");
      return;
    }

    startTransition(async () => {
      const res = await initiateMobileMoneyPaymentAction({
        studentId,
        amount,
        provider,
        phoneNumber,
        purpose,
        payerName: studentName,
      });

      if (res.success && res.data) {
        setActiveTxnRef(res.data.transactionReference);
        setUssdInstruction(res.data.ussdCodeInstruction);
        setStep("WAITING_CONFIRMATION");
        toast.success("Demande de paiement envoyée au téléphone !");
      } else {
        toast.error(res.error || "Erreur lors de l'initiation du paiement.");
      }
    });
  };

  const handleConfirm = () => {
    if (!activeTxnRef) return;

    startTransition(async () => {
      const res = await confirmMobileMoneyPaymentAction(activeTxnRef);
      if (res.success && res.data) {
        setReceipt(res.data);
        setStep("SUCCESS");
        toast.success("Paiement validé avec succès ! Reçu officiel généré.");
        if (onPaymentSuccess) {
          onPaymentSuccess(res.data);
        }
      } else {
        toast.error(res.error || "Impossible de valider la transaction.");
      }
    });
  };

  const handleShareWhatsApp = () => {
    if (!receipt) return;
    const text = encodeURIComponent(
      `🧾 *REÇU OFFICIEL DE PAIEMENT*\n` +
      `Étudiant: *${receipt.studentName}* (${receipt.matricule})\n` +
      `Montant: *${receipt.amountPaid.toLocaleString("fr-FR")} FCFA* réglé via *${receipt.provider}*\n` +
      `N° Reçu: ${receipt.receiptNumber}\n` +
      `Solde restant: ${receipt.newBalance.toLocaleString("fr-FR")} FCFA\n` +
      `Vérification: ${receipt.verificationQrUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1F222B] border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-white relative space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
        >
          <X size={20} />
        </button>

        {/* STEP 1: FORM */}
        {step === "FORM" && (
          <form onSubmit={handleInitiate} className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                <Smartphone size={14} /> Paiement Mobile Money • الدفع عبر الهاتف
              </div>
              <h2 className="text-xl font-black text-white mt-2">
                Règlement pour {studentName}
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Airtel Money Niger & Moov Africa Flooz (Paiement instantané et sécurisé)
              </p>
            </div>

            {/* Provider Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                1. Choisissez l&apos;opérateur
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Airtel Money Card */}
                <button
                  type="button"
                  onClick={() => setProvider("AIRTEL_MONEY")}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-24 ${
                    provider === "AIRTEL_MONEY"
                      ? "bg-red-950/40 border-red-500 text-white shadow-lg shadow-red-500/10 ring-2 ring-red-500/40"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Airtel Niger</span>
                  </div>
                  <div>
                    <p className="font-black text-sm text-white">Airtel Money</p>
                    <p className="text-[10px] text-slate-400">*144#</p>
                  </div>
                </button>

                {/* Moov Flooz Card */}
                <button
                  type="button"
                  onClick={() => setProvider("MOOV_FLOOZ")}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-24 ${
                    provider === "MOOV_FLOOZ"
                      ? "bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/40"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Moov Niger</span>
                  </div>
                  <div>
                    <p className="font-black text-sm text-white">Moov Flooz</p>
                    <p className="text-[10px] text-slate-400">*156#</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Amount and Phone Number */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  2. Montant à payer (FCFA)
                </label>
                <div className="relative mt-1.5">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="h-12 bg-slate-900 border-slate-700 text-white font-black text-lg pl-4 pr-16 rounded-xl"
                    placeholder="Ex: 50000"
                    required
                  />
                  <span className="absolute right-4 top-3 text-xs font-black text-indigo-400">
                    FCFA
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>3. Numéro de Téléphone {provider === "AIRTEL_MONEY" ? "Airtel" : "Moov"}</span>
                  <span className="text-[10px] text-slate-400 font-mono">+227 XX XX XX XX</span>
                </label>
                <div className="relative mt-1.5">
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-12 bg-slate-900 border-slate-700 text-white font-bold pl-11 rounded-xl"
                    placeholder="Ex: 90 12 34 56 ou 80 12 34 56"
                    required
                  />
                  <Phone size={16} className="absolute left-4 top-3.5 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  4. Motif du Paiement
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full h-11 mt-1.5 bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 outline-none"
                >
                  <option value="Frais de Scolarité">Frais de Scolarité (Tranche / Mensualité)</option>
                  <option value="Frais d'Inscription">Frais d&apos;Inscription & Dossier</option>
                  <option value="Frais d'Examen">Frais d&apos;Examen & Diplôme</option>
                  <option value="Transport Scolaire">Transport Scolaire</option>
                  <option value="Cantine & Restauration">Cantine & Restauration</option>
                </select>
              </div>
            </div>

            {/* Action Button */}
            <Button
              type="submit"
              disabled={isPending}
              className={`w-full h-12 text-white font-extrabold rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 ${
                provider === "AIRTEL_MONEY"
                  ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-600/20"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/20"
              }`}
            >
              {isPending ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Smartphone size={18} />
              )}
              Valider et Lancer le Paiement ({amount.toLocaleString("fr-FR")} FCFA)
            </Button>
          </form>
        )}

        {/* STEP 2: WAITING CONFIRMATION (USSD PUSH) */}
        {step === "WAITING_CONFIRMATION" && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center mx-auto animate-pulse">
              <Phone size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Validation sur votre Téléphone</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                {ussdInstruction}
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Montant :</span>
                <span className="font-black text-white">{amount.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Opérateur :</span>
                <span className="font-bold text-indigo-300">{provider === "AIRTEL_MONEY" ? "Airtel Money" : "Moov Flooz"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Réf. Transaction :</span>
                <span className="font-mono text-[11px] text-slate-300">{activeTxnRef}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                onClick={handleConfirm}
                disabled={isPending}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-lg gap-2"
              >
                {isPending ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                Confirmer la Réception du Paiement
              </Button>
              <button
                type="button"
                onClick={() => setStep("FORM")}
                className="text-xs text-slate-400 hover:text-white py-2"
              >
                Modifier le montant ou le numéro
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS & DIGITAL RECEIPT */}
        {step === "SUCCESS" && receipt && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-black text-white">Paiement Validé avec Succès !</h3>
              <p className="text-xs text-emerald-300 font-semibold">
                Un reçu certifié a été automatiquement transmis par WhatsApp & SMS.
              </p>
            </div>

            {/* Official Digital Receipt Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">N° Reçu Sécurisé</span>
                  <p className="text-sm font-mono font-black text-indigo-300">{receipt.receiptNumber}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Date & Heure</span>
                  <p className="text-xs text-slate-300 font-medium">{receipt.paymentDate}</p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[11px]">Étudiant :</span>
                <p className="text-sm font-black text-white">{receipt.studentName} ({receipt.matricule})</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Montant Réglé</span>
                  <p className="text-base font-black text-emerald-400 mt-0.5">
                    {receipt.amountPaid.toLocaleString("fr-FR")} FCFA
                  </p>
                  <span className="text-[10px] text-slate-400">{receipt.provider}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Nouveau Solde</span>
                  <p className="text-base font-black text-white mt-0.5">
                    {receipt.newBalance.toLocaleString("fr-FR")} FCFA
                  </p>
                  <span className="text-[10px] text-slate-400">{receipt.newBalance <= 0 ? "Totalement soldé" : "Solde restant"}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800">
                <div className="flex items-center gap-1.5 text-indigo-300">
                  <ShieldCheck size={14} />
                  <span>Certifié conforme & anti-fraude</span>
                </div>
                <span className="font-mono text-[10px] text-slate-500">QR-VERIFIED</span>
              </div>
            </div>

            {/* Sharing & Printing Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Button
                onClick={handleShareWhatsApp}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs h-11 gap-2 shadow-lg shadow-emerald-600/20"
              >
                <Share2 size={15} />
                Partager sur WhatsApp
              </Button>
              <Button
                onClick={handlePrintReceipt}
                variant="outline"
                className="flex-1 border-slate-700 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs h-11 gap-2"
              >
                <Printer size={15} />
                Imprimer Reçu
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
