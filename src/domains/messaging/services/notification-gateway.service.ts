import { db } from "@/infrastructure/database";
import { messageLogs } from "@/infrastructure/database/schema/messaging";
import { getActiveSchoolId } from "@/domains/auth/services/school";

export interface NotificationPayload {
  recipientPhone: string;
  recipientName?: string;
  studentName: string;
  messageFr: string;
  messageAr?: string;
  channel: "WHATSAPP" | "SMS" | "BOTH";
  subject?: string;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  whatsAppUrl?: string;
  smsSent?: boolean;
  channelUsed: string;
  error?: string;
}

export class NotificationGatewayService {
  /**
   * Cleans and normalizes Niger and West African phone numbers.
   * e.g., "90 12 34 56" -> "22790123456"
   */
  static normalizePhoneNumber(phone: string): string {
    let cleaned = phone.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("+")) {
      cleaned = cleaned.substring(1);
    }
    // If 8 digits (standard Niger local number), add Niger country code 227
    if (cleaned.length === 8) {
      cleaned = `227${cleaned}`;
    }
    return cleaned;
  }

  /**
   * Generates a direct Click-to-WhatsApp link.
   * Works on any phone/desktop without requiring API subscriptions.
   */
  static generateWhatsAppUrl(phone: string, text: string): string {
    const normalizedPhone = this.normalizePhoneNumber(phone);
    const encodedText = encodeURIComponent(text);
    return `https://wa.me/${normalizedPhone}?text=${encodedText}`;
  }

  /**
   * Dispatches a notification via WhatsApp and/or SMS, logging it to the database.
   */
  static async sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      const { recipientPhone, recipientName, studentName, messageFr, channel, subject } = payload;
      const normalizedPhone = this.normalizePhoneNumber(recipientPhone);

      const whatsAppUrl = this.generateWhatsAppUrl(normalizedPhone, messageFr);

      // Simulate or dispatch SMS (Can integrate HTTP POST to telecom gateway / Twilio / Infobip)
      let smsSent = false;
      if (channel === "SMS" || channel === "BOTH") {
        // If an SMS Gateway API Key is set in process.env, it triggers the HTTP request
        if (process.env.SMS_GATEWAY_URL && process.env.SMS_API_KEY) {
          try {
            await fetch(process.env.SMS_GATEWAY_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.SMS_API_KEY}`,
              },
              body: JSON.stringify({
                to: normalizedPhone,
                text: messageFr,
                sender: process.env.SMS_SENDER_NAME || "EDUT-NIGER",
              }),
            });
            smsSent = true;
          } catch (err) {
            console.warn("SMS Gateway dispatch failed, logged as pending:", err);
          }
        } else {
          // Simulation / Logging mode
          smsSent = true;
        }
      }

      // Log notification in messageLogs
      await db.insert(messageLogs).values({
        msgType: channel,
        targetAudience: recipientName || `Tuteur de ${studentName} (${normalizedPhone})`,
        subject: subject || `Notification Scolaire - ${studentName}`,
        content: messageFr,
        recipientCount: 1,
        status: "Envoyé",
        sentBy: "Système Automatique EDUT",
      }).catch((e) => console.warn("Failed to write to messageLogs:", e));

      return {
        success: true,
        whatsAppUrl,
        smsSent,
        channelUsed: channel,
      };
    } catch (error: any) {
      console.error("Error in NotificationGatewayService:", error);
      return {
        success: false,
        channelUsed: payload.channel,
        error: error?.message || "Erreur lors de l'envoi de la notification",
      };
    }
  }

  /**
   * Helper: Dispatch instant Payment Receipt via WhatsApp & SMS
   */
  static async dispatchPaymentReceipt(data: {
    studentName: string;
    parentPhone: string;
    amountPaid: number;
    remainingBalance: number;
    receiptNumber: string;
    paymentMethod: string; // "Airtel Money" | "Moov Flooz" | "Espèces"
    schoolName?: string;
  }): Promise<NotificationResult> {
    const { studentName, parentPhone, amountPaid, remainingBalance, receiptNumber, paymentMethod, schoolName = "U.P.R / UPIAI" } = data;

    const messageFr = `🧾 *${schoolName.toUpperCase()} — REÇU DE PAIEMENT*\n\n` +
      `Cher parent/tuteur,\n` +
      `Nous confirmons la bonne réception du paiement pour l'étudiant(e) : *${studentName}*.\n\n` +
      `• *Montant payé* : ${amountPaid.toLocaleString("fr-FR")} FCFA\n` +
      `• *Mode de règlement* : ${paymentMethod}\n` +
      `• *N° de Reçu Sécurisé* : ${receiptNumber}\n` +
      `• *Solde restant* : ${remainingBalance.toLocaleString("fr-FR")} FCFA\n` +
      `• *Date & Heure* : ${new Date().toLocaleString("fr-FR")}\n\n` +
      `Conservez ce message comme justificatif officiel. Merci pour votre confiance !`;

    const messageAr = `🧾 *إيصال سداد رسمي*\n` +
      `تم استلام مبلغ ${amountPaid} فرنك للطالب(ة) ${studentName} عبر ${paymentMethod}.\n` +
      `رقم الإيصال: ${receiptNumber}\n` +
      `المتبقي: ${remainingBalance} فرنك.`;

    return this.sendNotification({
      recipientPhone: parentPhone,
      studentName,
      messageFr,
      messageAr,
      channel: "BOTH",
      subject: `Reçu de paiement ${receiptNumber} - ${studentName}`,
    });
  }

  /**
   * Helper: Dispatch Instant Absence Alert via WhatsApp & SMS
   */
  static async dispatchAbsenceAlert(data: {
    studentName: string;
    parentPhone: string;
    className: string;
    dateStr?: string;
    schoolName?: string;
  }): Promise<NotificationResult> {
    const { studentName, parentPhone, className, dateStr = new Date().toLocaleDateString("fr-FR"), schoolName = "Administration Scolaire" } = data;

    const messageFr = `🚨 *ALERTE D'ABSENCE — ${schoolName.toUpperCase()}*\n\n` +
      `Bonjour,\n` +
      `Nous vous informons que l'élève/étudiant(e) *${studentName}* (Classe : *${className}*) a été marqué(e) *ABSENT(E)* ce jour le *${dateStr}*.\n\n` +
      `Si cette absence est justifiée, merci de faire parvenir un justificatif au bureau de la vie scolaire dans les 48h.\n` +
      `Pour toute question, contactez la scolarité.`;

    const messageAr = `🚨 *إشعار غياب فوري*\n` +
      `نحيطكم علماً بأن الطالب(ة) ${studentName} (${className}) تغيب عن الحصص الدراسية بتاريخ اليوم ${dateStr}.`;

    return this.sendNotification({
      recipientPhone: parentPhone,
      studentName,
      messageFr,
      messageAr,
      channel: "BOTH",
      subject: `Alerte Absence - ${studentName}`,
    });
  }

  /**
   * Helper: Dispatch Tuition Due Reminder via WhatsApp & SMS
   */
  static async dispatchTuitionDueReminder(data: {
    studentName: string;
    parentPhone: string;
    className: string;
    amountDue: number;
    dueDate?: string;
    schoolName?: string;
  }): Promise<NotificationResult> {
    const { studentName, parentPhone, className, amountDue, dueDate = "fin du mois", schoolName = "Service Comptabilité" } = data;

    const messageFr = `📢 *RAPPEL DE SCOLARITÉ — ${schoolName.toUpperCase()}*\n\n` +
      `Cher parent d'élève,\n` +
      `Sauf erreur de notre part, le compte de *${studentName}* (${className}) présente un solde restant de : *${amountDue.toLocaleString("fr-FR")} FCFA* à régler avant le *${dueDate}*.\n\n` +
      `💡 *Paiement Rapide par Mobile Money* :\n` +
      `Vous pouvez désormais régler directement et en toute sécurité par *Airtel Money* ou *Moov Flooz* depuis votre téléphone.\n` +
      `Merci de régulariser la situation dans les meilleurs délais.`;

    return this.sendNotification({
      recipientPhone: parentPhone,
      studentName,
      messageFr,
      channel: "BOTH",
      subject: `Rappel échéance frais de scolarité - ${studentName}`,
    });
  }
}
