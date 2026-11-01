"use client";

import React, { useState, useTransition } from "react";
import { 
  MessageSquare, Phone, Send, X, AlertTriangle, 
  Calendar, DollarSign, CheckCircle2, User, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  sendDirectWhatsAppAlertAction, 
  dispatchAbsenceNotificationAction, 
  dispatchTuitionReminderAction 
} from "../actions/notification.actions";
import { NotificationGatewayService } from "../services/notification-gateway.service";

interface QuickWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  className?: string;
  parentPhone?: string;
  defaultType?: "ABSENCE" | "TUITION" | "CUSTOM";
  amountDue?: number;
}

export function QuickWhatsAppModal({
  isOpen,
  onClose,
  studentName,
  className = "Classe non spécifiée",
  parentPhone = "",
  defaultType = "ABSENCE",
  amountDue = 0,
}: QuickWhatsAppModalProps) {
  const [phone, setPhone] = useState(parentPhone || "");
  const [templateType, setTemplateType] = useState<"ABSENCE" | "TUITION" | "CUSTOM">(defaultType);
  const [customText, setCustomText] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const getGeneratedMessage = () => {
    if (templateType === "ABSENCE") {
      return `🚨 *ALERTE D'ABSENCE*\n` +
        `Bonjour,\n` +
        `Nous vous informons que votre enfant *${studentName}* (Classe : *${className}*) a été marqué(e) *ABSENT(E)* aujourd'hui.\n` +
        `Merci de contacter la scolarité pour justifier cette absence dans les 48h.`;
    } else if (templateType === "TUITION") {
      return `📢 *RAPPEL DE SCOLARITÉ*\n` +
        `Bonjour,\n` +
        `Le compte de *${studentName}* (${className}) présente un solde de *${amountDue.toLocaleString("fr-FR")} FCFA* à régler.\n` +
        `Vous pouvez régler directement et en toute sécurité par *Airtel Money* ou *Moov Flooz* depuis votre téléphone.\n` +
        `Merci de votre confiance.`;
    }
    return customText || `Bonjour, concernant l'élève ${studentName} (${className})...`;
  };

  const handleOpenWhatsApp = () => {
    if (!phone.trim()) {
      toast.error("Veuillez renseigner un numéro de téléphone.");
      return;
    }
    const message = getGeneratedMessage();
    const url = NotificationGatewayService.generateWhatsAppUrl(phone, message);
    window.open(url, "_blank");
    toast.success("Discussion WhatsApp ouverte !");
    onClose();
  };

  const handleSendSms = () => {
    if (!phone.trim()) {
      toast.error("Veuillez renseigner un numéro de téléphone.");
      return;
    }
    const message = getGeneratedMessage();

    startTransition(async () => {
      const res = await sendDirectWhatsAppAlertAction({
        recipientPhone: phone,
        studentName,
        messageText: message,
      });

      if (res.success) {
        toast.success("Notification enregistrée et transmise par SMS !");
        onClose();
      } else {
        toast.error(res.error || "Erreur d'envoi.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1F222B] border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-white relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
        >
          <X size={20} />
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <MessageSquare size={14} /> Communication Directe • WhatsApp & SMS
          </div>
          <h3 className="text-xl font-black text-white mt-1">
            Contacter le Tuteur de {studentName}
          </h3>
        </div>

        {/* Template Selector */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setTemplateType("ABSENCE")}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition border ${
              templateType === "ABSENCE"
                ? "bg-rose-500/20 border-rose-500 text-rose-300"
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            Alerte Absence
          </button>
          <button
            type="button"
            onClick={() => setTemplateType("TUITION")}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition border ${
              templateType === "TUITION"
                ? "bg-amber-500/20 border-amber-500 text-amber-300"
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            Rappel Scolarité
          </button>
          <button
            type="button"
            onClick={() => setTemplateType("CUSTOM")}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition border ${
              templateType === "CUSTOM"
                ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            Message Libre
          </button>
        </div>

        {/* Phone Input */}
        <div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Numéro de Téléphone (WhatsApp / SMS)</span>
            <span className="text-[10px] text-slate-400 font-mono">+227 XX XX XX XX</span>
          </label>
          <div className="relative mt-1.5">
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11 bg-slate-900 border-slate-700 text-white font-bold pl-10 rounded-xl text-sm"
              placeholder="Ex: 90 12 34 56 ou 80 12 34 56"
            />
            <Phone size={16} className="absolute left-3.5 top-3 text-slate-400" />
          </div>
        </div>

        {/* Custom text or Preview */}
        {templateType === "CUSTOM" ? (
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Texte du message
            </label>
            <Textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Saisissez votre message ici..."
              className="mt-1.5 bg-slate-900 border-slate-700 text-white text-xs min-h-[90px] rounded-xl"
            />
          </div>
        ) : (
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Aperçu du message généré
            </label>
            <div className="mt-1.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
              {getGeneratedMessage()}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            onClick={handleOpenWhatsApp}
            className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs gap-2 shadow-lg shadow-emerald-600/20"
          >
            <MessageSquare size={16} />
            Ouvrir dans WhatsApp
          </Button>
          <Button
            type="button"
            onClick={handleSendSms}
            disabled={isPending}
            variant="outline"
            className="flex-1 h-11 border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold rounded-xl text-xs gap-2"
          >
            {isPending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            Envoyer par SMS
          </Button>
        </div>
      </div>
    </div>
  );
}
