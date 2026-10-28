import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, or } from "drizzle-orm";
import { db, readDb } from "@/infrastructure/database";
import { students } from "@/infrastructure/database/schema/students";
import { schools } from "@/infrastructure/database/schema/auth";
import { hostelExitPermissions } from "@/infrastructure/database/schema/hostel";
import { notifications } from "@/infrastructure/database/schema/messaging";
import { studentFees } from "@/infrastructure/database/schema/finance";
import { studentAttendance } from "@/infrastructure/database/schema/attendance";
import { schoolClasses } from "@/infrastructure/database/schema/academics";
import { getMobileUser, mobileJsonError } from "../../_lib/auth";
import { decodeStudentToken } from "@/shared/utils/student-token";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { user, response } = await getMobileUser(request);
  if (response || !user) return response || mobileJsonError("Non autorisé", 401);

  try {
    const body = await request.json();
    const { qrPayload, action, note } = body;

    if (!qrPayload) {
      return mobileJsonError("Code QR manquant", 400);
    }

    // 1. Decode token
    const decoded = decodeStudentToken(qrPayload);
    let studentId = decoded?.studentId;

    let student = null;
    if (studentId) {
      student = await readDb.query.students.findFirst({
        where: eq(students.id, studentId),
      });
    }

    // Fallback: If not found by ID, try searching by matricule (numAdmission)
    if (!student && qrPayload.trim()) {
      student = await readDb.query.students.findFirst({
        where: eq(students.numAdmission, qrPayload.trim()),
      });
      if (student) {
        studentId = student.id;
      }
    }

    if (!student) {
      return NextResponse.json({
        success: false,
        valid: false,
        message: "Élève introuvable ou code QR invalide",
        alertLevel: "red",
      }, { status: 404 });
    }

    // 2. Multi-tenant school isolation check (unless superadmin)
    if (user.schoolId && student.schoolId && user.schoolId !== student.schoolId) {
      return NextResponse.json({
        success: false,
        valid: false,
        message: "Attention : Cet élève appartient à un autre établissement !",
        alertLevel: "red",
        student: {
          nom: student.nomEtudiant,
          classe: student.classe,
          matricule: student.numAdmission,
        }
      }, { status: 403 });
    }

    // 3. Fetch School Details
    let schoolInfo = null;
    if (student.schoolId) {
      const sch = await readDb.query.schools.findFirst({
        where: eq(schools.id, student.schoolId),
      });
      if (sch) {
        schoolInfo = {
          name: sch.name,
          logo: sch.logoPath,
        };
      }
    }

    // 4. Check Hostel Exit Permissions (Sortie Internat)
    let activeExitPermission = null;
    try {
      const perms = await readDb.query.hostelExitPermissions.findMany({
        where: and(
          eq(hostelExitPermissions.studentId, student.id),
          eq(hostelExitPermissions.status, "Approuvé")
        ),
        orderBy: [desc(hostelExitPermissions.createdAt)],
        limit: 1,
      });
      if (perms.length > 0) {
        activeExitPermission = perms[0];
      }
    } catch {
      // Ignore if table schema not linked
    }

    // 5. Check Student Financial Status (studentFees)
    let financialStatus = {
      isUpToDate: true,
      balance: Number(student.ancienSolde || 0),
      totalExpected: Number(student.fraisMensuels || 0),
      totalPaid: 0,
      status: Number(student.ancienSolde || 0) > 0 ? "Impayé" : "En règle",
    };
    try {
      const feeRecords = await readDb.query.studentFees.findMany({
        where: eq(studentFees.studentId, student.id),
        orderBy: [desc(studentFees.id)],
        limit: 1,
      });
      if (feeRecords.length > 0) {
        const fee = feeRecords[0];
        const bal = Number(fee.balance || 0);
        financialStatus = {
          isUpToDate: bal <= 0,
          balance: bal,
          totalExpected: Number(fee.totalExpected || 0),
          totalPaid: Number(fee.totalPaid || 0),
          status: bal <= 0 ? "En règle" : (Number(fee.totalPaid || 0) > 0 ? "Partiel" : "Impayé"),
        };
      }
    } catch {
      // Ignore if studentFees not populated
    }

    // 6. Evaluate Gate Decision Status
    const isStatusActive = (student.statut || "Actif").toLowerCase() === "actif";
    let alertLevel: "green" | "yellow" | "red" = isStatusActive ? "green" : "red";
    let decisionReason = isStatusActive
      ? (financialStatus.isUpToDate
          ? "Élève en règle • Accès autorisé"
          : `Élève actif • Solde restant: ${financialStatus.balance.toLocaleString("fr-FR")} FCFA`)
      : `Statut élève : ${student.statut}`;

    if (student.categorie?.toLowerCase().includes("interne") && !activeExitPermission && action === "exit") {
      alertLevel = "yellow";
      decisionReason = "Élève interne sans bon de sortie validé !";
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const parentPhone = student.whatsapp || student.mobile || student.phoneFixe;
    let whatsappAlert = null;

    if (parentPhone) {
      let cleanPhone = parentPhone.replace(/\D/g, "");
      if (cleanPhone.length === 8) cleanPhone = `227${cleanPhone}`;
      const isExit = action === "exit";
      const waText = `*${schoolInfo?.name || "CES BOURJA - MARADI"} • SÉCURITÉ CAMPUS* 🛡️\n\nBonjour Cher Parent (${student.nomPere || "Parent d'élève"}),\nNous vous informons que votre enfant *${student.nomEtudiant}* (${student.classe || ""}) a été enregistré au portail de l'établissement (*${isExit ? "Sortie" : "Entrée"}*) à ${timeStr}.\n\n_Plateforme Numérique CES BOURJA • Sécurité certifiée_`;
      whatsappAlert = {
        phone: cleanPhone,
        message: waText,
        link: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waText)}`,
      };
    }

    // 7. Handle Action logging (Entry / Exit) + Automatic Attendance on Entry
    let actionLogged = null;
    if (action === "entry" || action === "exit") {
      actionLogged = {
        action,
        timestamp: now.toISOString(),
        recordedBy: user.utilisateur || "Agent de sécurité",
        note: note || "",
      };

      const notifTitle = action === "entry" ? "Arrivée à l'école" : "Départ de l'école";
      const notifContent = `L'élève ${student.nomEtudiant} (Classe: ${student.classe || "N/A"}) a franchi le portail (${action === "entry" ? "Entrée" : "Sortie"}) à ${timeStr}.`;

      // 7a. Record automatic attendance on entry
      if (action === "entry") {
        try {
          let classId = (student as any).classId || null;
          if (!classId && student.classe) {
            const cls = await readDb.query.schoolClasses.findFirst({
              where: eq(schoolClasses.className, student.classe),
            });
            classId = cls?.id || null;
          }
          if (classId) {
            await db.insert(studentAttendance).values({
              schoolId: student.schoolId || user.schoolId || 2,
              studentId: student.id,
              classId,
              date: now,
              status: "Présent",
              remark: `Portail QR (${timeStr})`,
              recordedBy: user.utilisateur || "Portail QR",
            });
          }
        } catch {
          // Non-blocking attendance insert
        }
      }

      // 7b. Push notification to in-app notification center
      try {
        await db.insert(notifications).values({
          title: notifTitle,
          content: notifContent,
          type: "info",
          category: "Sécurité",
          isRead: false,
        });
      } catch {
        // notification non-blocking
      }
    }

    return NextResponse.json({
      success: true,
      valid: true,
      alertLevel,
      decisionReason,
      actionLogged,
      whatsappAlert,
      financialStatus,
      student: {
        id: student.id,
        nom: student.nomEtudiant,
        nomArabe: student.nomArabe,
        matricule: student.numAdmission,
        classe: student.classe,
        section: student.section,
        educationalLevel: student.educationalLevel,
        photoUrl: student.photoPath,
        groupeSanguin: student.groupeSanguin || "Non renseigné",
        statut: student.statut || "Actif",
        categorie: student.categorie || "Externe",
        parentNom: student.nomPere || "Tuteur légal",
        parentPhone: student.mobile || student.whatsapp || student.phoneFixe,
        whatsapp: student.whatsapp,
        emergencyPhone: student.mobile,
      },
      school: schoolInfo,
      hostelPermission: activeExitPermission ? {
        id: activeExitPermission.id,
        reason: activeExitPermission.reason,
        exitTime: activeExitPermission.exitTime,
        returnTime: activeExitPermission.returnTime,
        status: activeExitPermission.status,
      } : null,
    });

  } catch (error: any) {
    console.error("Gate scan error:", error);
    return mobileJsonError(error.message || "Erreur lors du scan du pass", 500);
  }
}
