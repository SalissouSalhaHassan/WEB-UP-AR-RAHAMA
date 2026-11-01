"use server";

import { protectedDbAction } from "@/lib/protected-action";
import { 
  MobileMoneyService, 
  InitiatePaymentPayload 
} from "../services/mobile-money.service";

/**
 * Server action to initiate an Airtel Money / Moov Flooz payment
 */
export async function initiateMobileMoneyPaymentAction(payload: InitiatePaymentPayload) {
  return protectedDbAction("Finances", "canEdit", async () => {
    try {
      const result = await MobileMoneyService.initiatePayment(payload);
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error?.message || "Échec de l'initiation du paiement Mobile Money." };
    }
  });
}

/**
 * Server action to confirm a Mobile Money payment and credit student ledger
 */
export async function confirmMobileMoneyPaymentAction(transactionReference: string) {
  return protectedDbAction("Finances", "canEdit", async () => {
    try {
      const receipt = await MobileMoneyService.confirmAndCreditPayment(transactionReference);
      return { success: true, data: receipt };
    } catch (error: any) {
      return { success: false, error: error?.message || "Échec de la validation du paiement." };
    }
  });
}

/**
 * Server action to get student transaction history
 */
export async function getStudentMobileMoneyTransactionsAction(studentId: number) {
  return protectedDbAction("Finances", "canView", async () => {
    try {
      const transactions = await MobileMoneyService.getStudentTransactions(studentId);
      return { success: true, data: transactions };
    } catch (error: any) {
      return { success: false, error: error?.message || "Erreur de récupération des transactions." };
    }
  });
}
