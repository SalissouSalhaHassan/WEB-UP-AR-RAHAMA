"use server";

import { protectedDbAction } from "@/lib/protected-action";
import { NotificationGatewayService } from "../services/notification-gateway.service";

/**
 * Server action to send a direct WhatsApp alert
 */
export async function sendDirectWhatsAppAlertAction(payload: {
  recipientPhone: string;
  studentName: string;
  messageText: string;
}) {
  return protectedDbAction("Students", "canEdit", async () => {
    try {
      const result = await NotificationGatewayService.sendNotification({
        recipientPhone: payload.recipientPhone,
        studentName: payload.studentName,
        messageFr: payload.messageText,
        channel: "WHATSAPP",
      });
      return { success: true, data: result };
    } catch (e: any) {
      return { success: false, error: e?.message || "Erreur d'envoi WhatsApp." };
    }
  });
}

/**
 * Server action to dispatch an immediate student absence alert
 */
export async function dispatchAbsenceNotificationAction(payload: {
  studentName: string;
  parentPhone: string;
  className: string;
  dateStr?: string;
}) {
  return protectedDbAction("Students", "canEdit", async () => {
    try {
      const result = await NotificationGatewayService.dispatchAbsenceAlert(payload);
      return { success: true, data: result };
    } catch (e: any) {
      return { success: false, error: e?.message || "Erreur d'alerte absence." };
    }
  });
}

/**
 * Server action to dispatch a tuition due reminder via WhatsApp and SMS
 */
export async function dispatchTuitionReminderAction(payload: {
  studentName: string;
  parentPhone: string;
  className: string;
  amountDue: number;
  dueDate?: string;
}) {
  return protectedDbAction("Finances", "canEdit", async () => {
    try {
      const result = await NotificationGatewayService.dispatchTuitionDueReminder(payload);
      return { success: true, data: result };
    } catch (e: any) {
      return { success: false, error: e?.message || "Erreur d'envoi du rappel." };
    }
  });
}
