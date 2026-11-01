"use server";

import { protectedDbAction } from "@/lib/protected-action";
import { db, readDb } from "@/infrastructure/database";
import { students } from "@/infrastructure/database/schema/students";
import { studentAttendance } from "@/infrastructure/database/schema/attendance";
import { schoolClasses } from "@/infrastructure/database/schema/academics";
import { eq, and, gte, lte, or, sql, desc } from "drizzle-orm";
import { getActiveSchoolId } from "@/domains/auth/services/school";
import { NotificationGatewayService } from "@/domains/messaging/services/notification-gateway.service";

export interface GateScanResult {
  success: boolean;
  student?: {
    id: number;
    nomEtudiant: string;
    numAdmission: string;
    classe: string;
    photoUrl?: string | null;
    status: "Présent" | "En Retard" | "Non Autorisé";
    entryTime: string;
    parentNotified?: boolean;
  };
  stats?: {
    totalScanned: number;
    onTimeCount: number;
    lateCount: number;
  };
  error?: string;
}

/**
 * Server action to record gate turnstile scan (Kiosk Mode)
 */
export async function recordGateScanAction(payload: {
  identifier: string; // numAdmission, studentId, or QR payload
  gateName?: string;
  lateCutoffTime?: string; // e.g. "08:15"
  notifyParent?: boolean;
}): Promise<GateScanResult> {
  return protectedDbAction("Attendance", "canEdit", async () => {
    try {
      const schoolId = await getActiveSchoolId();
      const rawId = payload.identifier.trim();

      // Find student by numAdmission, ID, or raw string
      let student = await db.query.students.findFirst({
        where: and(
          eq(students.schoolId, schoolId),
          or(
            eq(students.numAdmission, rawId),
            !isNaN(Number(rawId)) ? eq(students.id, Number(rawId)) : undefined
          )
        ),
      });

      // If not found directly, try prefix search or numeric extraction
      if (!student && rawId.includes("-")) {
        student = await db.query.students.findFirst({
          where: and(
            eq(students.schoolId, schoolId),
            eq(students.numAdmission, rawId)
          ),
        });
      }

      if (!student) {
        return {
          success: false,
          error: `Badge ou identifiant [${rawId}] introuvable dans l'établissement.`,
        };
      }

      const now = new Date();
      const currentTimeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const [currentHour, currentMin] = [now.getHours(), now.getMinutes()];

      // Check if late (default late cutoff: 08:15 AM)
      const [cutoffHour, cutoffMin] = (payload.lateCutoffTime || "08:15").split(":").map(Number);
      const isLate = (currentHour > cutoffHour) || (currentHour === cutoffHour && currentMin > cutoffMin);
      const status: "Présent" | "En Retard" = isLate ? "En Retard" : "Présent";

      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const dayStart = new Date(`${todayStr}T00:00:00.000Z`);
      const dayEnd = new Date(`${todayStr}T23:59:59.999Z`);

      // Resolve student classId
      let classId = student.classId;
      if (!classId && student.classe) {
        const foundCls = await db.query.schoolClasses.findFirst({
          where: and(
            eq(schoolClasses.schoolId, schoolId),
            eq(schoolClasses.className, student.classe)
          ),
        });
        if (foundCls) classId = foundCls.id;
      }

      // Check if already scanned today
      const existingAttendance = await db.query.studentAttendance.findFirst({
        where: and(
          eq(studentAttendance.studentId, student.id),
          gte(studentAttendance.date, dayStart),
          lte(studentAttendance.date, dayEnd)
        ),
      });

      if (existingAttendance) {
        // Update existing record with gate time
        await db
          .update(studentAttendance)
          .set({
            status,
            remarks: `Pointage Portail [${payload.gateName || "Entrée Principale"}] à ${currentTimeStr}`,
          })
          .where(eq(studentAttendance.id, existingAttendance.id));
      } else {
        // Insert new gate attendance
        await db.insert(studentAttendance).values({
          studentId: student.id,
          classId: classId || 1,
          date: now,
          status,
          remarks: `Pointage Portail [${payload.gateName || "Entrée Principale"}] à ${currentTimeStr}`,
        });
      }

      // Optional: Send instant WhatsApp notification to parent
      let parentNotified = false;
      if (payload.notifyParent) {
        const parentPhone = student.contactUrgence || student.telephoneTuteur;
        if (parentPhone) {
          const alertMsg = isLate
            ? `⚠️ *U.P.R / UPIAI — POINTAGE PORTAIL (RETARD)*\n` +
              `Bonjour, nous vous informons que *${student.nomEtudiant}* (${student.classe || "Élève"}) est entré(e) sur le campus avec un *RETARD* à *${currentTimeStr}*.\n` +
              `Heure limite d'arrivée : ${payload.lateCutoffTime || "08h15"}.`
            : `✅ *U.P.R / UPIAI — POINTAGE PORTAIL (ARRIVÉE)*\n` +
              `Bonjour, nous vous confirmons la bonne arrivée de *${student.nomEtudiant}* (${student.classe || "Élève"}) sur le campus ce jour à *${currentTimeStr}*. Bonne journée !`;

          NotificationGatewayService.sendNotification({
            recipientPhone: parentPhone,
            studentName: student.nomEtudiant,
            messageFr: alertMsg,
            channel: "WHATSAPP",
            subject: `Pointage Portail - ${student.nomEtudiant}`,
          }).catch(() => {});
          parentNotified = true;
        }
      }

      return {
        success: true,
        student: {
          id: student.id,
          nomEtudiant: student.nomEtudiant,
          numAdmission: student.numAdmission || `ETU-${student.id}`,
          classe: student.classe || "Classe générale",
          photoUrl: student.photoPath || null,
          status,
          entryTime: currentTimeStr,
          parentNotified,
        },
      };
    } catch (error: any) {
      console.error("Error in recordGateScanAction:", error);
      return {
        success: false,
        error: error?.message || "Erreur lors du pointage au portail.",
      };
    }
  });
}

/**
 * Server action to get turnstile counter statistics for today
 */
export async function getGateTodayStatsAction() {
  return protectedDbAction("Attendance", "canView", async () => {
    try {
      const schoolId = await getActiveSchoolId();
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const dayStart = new Date(`${todayStr}T00:00:00.000Z`);
      const dayEnd = new Date(`${todayStr}T23:59:59.999Z`);

      const records = await db
        .select({
          status: studentAttendance.status,
          count: sql<number>`count(*)`,
        })
        .from(studentAttendance)
        .where(
          and(
            gte(studentAttendance.date, dayStart),
            lte(studentAttendance.date, dayEnd)
          )
        )
        .groupBy(studentAttendance.status);

      let presents = 0;
      let lates = 0;
      for (const r of records) {
        if (r.status === "Présent") presents += Number(r.count);
        if (r.status === "En Retard") lates += Number(r.count);
      }

      return {
        success: true,
        data: {
          totalScanned: presents + lates,
          onTimeCount: presents,
          lateCount: lates,
        },
      };
    } catch (e: any) {
      return {
        success: true,
        data: { totalScanned: 0, onTimeCount: 0, lateCount: 0 },
      };
    }
  });
}
