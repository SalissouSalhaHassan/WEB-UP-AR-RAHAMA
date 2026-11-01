import { db } from "@/infrastructure/database";
import { 
  onlineTransactions, 
  studentFees, 
  feePayments 
} from "@/infrastructure/database/schema/finance";
import { students } from "@/infrastructure/database/schema/students";
import { eq, and, desc } from "drizzle-orm";
import { getActiveSchoolId } from "@/domains/auth/services/school";
import { NotificationGatewayService } from "@/domains/messaging/services/notification-gateway.service";

export type MobileMoneyProvider = "AIRTEL_MONEY" | "MOOV_FLOOZ" | "WAVE";

export interface InitiatePaymentPayload {
  studentId: number;
  amount: number; // in FCFA (XOF)
  provider: MobileMoneyProvider;
  phoneNumber: string; // e.g. "+227 90 12 34 56"
  purpose: string; // "Scolarité", "Inscription", "Cantine", "Transport", "Frais d'examen"
  payerName?: string;
  payerEmail?: string;
}

export interface InitiatePaymentResponse {
  success: boolean;
  transactionReference: string;
  provider: MobileMoneyProvider;
  amount: number;
  phoneNumber: string;
  ussdCodeInstruction: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  messageFr: string;
  messageAr: string;
}

export interface DigitalReceiptData {
  receiptNumber: string;
  transactionReference: string;
  studentId: number;
  studentName: string;
  matricule: string;
  className: string;
  amountPaid: number;
  previousBalance: number;
  newBalance: number;
  purpose: string;
  provider: string;
  phoneNumber: string;
  paymentDate: string;
  verificationQrUrl: string;
  status: "VALIDE" | "ANNULE";
}

export class MobileMoneyService {
  /**
   * Initiates a Mobile Money payment transaction (Airtel Money or Moov Flooz)
   */
  static async initiatePayment(payload: InitiatePaymentPayload): Promise<InitiatePaymentResponse> {
    try {
      const schoolId = await getActiveSchoolId();
      const { studentId, amount, provider, phoneNumber, purpose } = payload;

      const student = await db.query.students.findFirst({
        where: eq(students.id, studentId),
      });

      if (!student) {
        throw new Error("Étudiant non trouvé");
      }

      const cleanPhone = NotificationGatewayService.normalizePhoneNumber(phoneNumber);
      const timestamp = Date.now();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const transactionReference = `PAY-${provider}-${timestamp}-${randomSuffix}`;

      // Provider-specific USSD prompt instruction for Niger
      let ussdCodeInstruction = "";
      if (provider === "AIRTEL_MONEY") {
        ussdCodeInstruction = `Veuillez vérifier votre téléphone. Un message USSD de débit Airtel Money de ${amount.toLocaleString("fr-FR")} FCFA va s'afficher. Composez *144# si le message ne s'affiche pas automatiquement.`;
      } else if (provider === "MOOV_FLOOZ") {
        ussdCodeInstruction = `Veuillez vérifier votre téléphone. Un message Moov Flooz de ${amount.toLocaleString("fr-FR")} FCFA va s'afficher. Composez *156# pour autoriser le paiement.`;
      } else {
        ussdCodeInstruction = `Ouvrez l'application Wave pour valider le débit de ${amount.toLocaleString("fr-FR")} FCFA.`;
      }

      // Record transaction as PENDING in onlineTransactions
      await db.insert(onlineTransactions).values({
        schoolId,
        studentId,
        transactionReference,
        provider,
        amount,
        currency: "XOF",
        phoneNumber: cleanPhone,
        status: "PENDING",
        purpose,
        webhookPayload: {
          payerName: payload.payerName || student.nomEtudiant,
          initiatedAt: new Date().toISOString(),
          cleanPhone,
        },
      });

      return {
        success: true,
        transactionReference,
        provider,
        amount,
        phoneNumber: cleanPhone,
        ussdCodeInstruction,
        status: "PENDING",
        messageFr: `Paiement Mobile Money initié avec succès. ${ussdCodeInstruction}`,
        messageAr: `تم بدء عملية الدفع عبر الهاتف بنجاح. يرجى تأكيد الخصم على هاتفك المحمول.`,
      };
    } catch (error: any) {
      console.error("Error initiating Mobile Money payment:", error);
      throw error;
    }
  }

  /**
   * Confirms payment and credits the student's balance in the financial ledger
   */
  static async confirmAndCreditPayment(transactionReference: string): Promise<DigitalReceiptData> {
    try {
      const schoolId = await getActiveSchoolId();

      const txn = await db.query.onlineTransactions.findFirst({
        where: eq(onlineTransactions.transactionReference, transactionReference),
      });

      if (!txn) {
        throw new Error("Transaction introuvable");
      }

      if (!txn.studentId) {
        throw new Error("Aucun étudiant lié à cette transaction");
      }

      const student = await db.query.students.findFirst({
        where: eq(students.id, txn.studentId),
      });

      if (!student) {
        throw new Error("Étudiant introuvable");
      }

      // 1. Mark transaction as SUCCESS
      await db
        .update(onlineTransactions)
        .set({
          status: "SUCCESS",
          updatedAt: new Date(),
        })
        .where(eq(onlineTransactions.id, txn.id));

      // 2. Fetch or update student fee ledger
      let feeRecord = await db.query.studentFees.findFirst({
        where: eq(studentFees.studentId, student.id),
      });

      const amountPaid = Number(txn.amount);
      const previousPaid = Number(feeRecord?.totalPaid) || 0;
      const expectedTotal = Number(feeRecord?.totalExpected) || (student.fraisMensuels ? student.fraisMensuels * 9 : 250000);
      const newTotalPaid = previousPaid + amountPaid;
      const newBalance = Math.max(0, expectedTotal - newTotalPaid);
      const newStatus = newBalance <= 0 ? "Payé" : newTotalPaid > 0 ? "Partiel" : "Non payé";

      if (feeRecord) {
        await db
          .update(studentFees)
          .set({
            totalPaid: newTotalPaid,
            balance: newBalance,
            status: newStatus,
            updatedAt: new Date(),
          })
          .where(eq(studentFees.id, feeRecord.id));
      } else {
        const [inserted] = await db
          .insert(studentFees)
          .values({
            schoolId,
            studentId: student.id,
            totalExpected: expectedTotal,
            totalPaid: newTotalPaid,
            balance: newBalance,
            status: newStatus,
          })
          .returning();
        feeRecord = inserted;
      }

      // 3. Insert real feePayments record
      const providerLabel = txn.provider === "AIRTEL_MONEY" ? "Airtel Money Niger" : txn.provider === "MOOV_FLOOZ" ? "Moov Africa Flooz" : "Wave";
      const receiptNumber = `REC-${new Date().getFullYear()}-${txn.id.toString().padStart(6, "0")}`;

      if (feeRecord) {
        await db.insert(feePayments).values({
          feeId: feeRecord.id,
          amount: amountPaid,
          paymentMethod: providerLabel,
          receiptNumber,
          notes: `Paiement en ligne validé par ${providerLabel}. Réf: ${txn.transactionReference}`,
        }).catch((e) => console.warn("Failed to insert feePayment:", e));
      }

      // 4. Dispatch instant WhatsApp & SMS Receipt to the parent/student
      const parentPhone = txn.phoneNumber || student.contactUrgence || student.telephoneTuteur || "90000000";
      await NotificationGatewayService.dispatchPaymentReceipt({
        studentName: student.nomEtudiant,
        parentPhone,
        amountPaid,
        remainingBalance: newBalance,
        receiptNumber,
        paymentMethod: providerLabel,
        schoolName: "U.P.R / UPIAI",
      });

      const verificationQrUrl = `https://web-upiai.vercel.app/verify/receipt/${receiptNumber}`;

      return {
        receiptNumber,
        transactionReference: txn.transactionReference,
        studentId: student.id,
        studentName: student.nomEtudiant,
        matricule: student.numAdmission || `ETU-${student.id}`,
        className: student.classe || "Non spécifié",
        amountPaid,
        previousBalance: expectedTotal - previousPaid,
        newBalance,
        purpose: txn.purpose || "Frais de Scolarité",
        provider: providerLabel,
        phoneNumber: txn.phoneNumber || "",
        paymentDate: new Date().toLocaleString("fr-FR"),
        verificationQrUrl,
        status: "VALIDE",
      };
    } catch (error: any) {
      console.error("Error confirming Mobile Money payment:", error);
      throw error;
    }
  }

  /**
   * Fetches recent transactions for a student
   */
  static async getStudentTransactions(studentId: number) {
    return db.query.onlineTransactions.findMany({
      where: eq(onlineTransactions.studentId, studentId),
      orderBy: desc(onlineTransactions.createdAt),
      limit: 20,
    });
  }
}
