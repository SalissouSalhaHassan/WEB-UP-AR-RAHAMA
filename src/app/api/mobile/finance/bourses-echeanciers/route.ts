import { NextRequest, NextResponse } from "next/server";
import { getMobileUser, mobileJsonError } from "../../_lib/auth";
import { getUserRoleType } from "@/domains/auth/services/rbac";
import {
  getBoursesAndEcheanciersDashboardData,
  triggerBulkScheduleReminders,
  triggerScheduleReminder,
  recordSchedulePayment,
} from "@/domains/finance/actions/bourses-echeanciers.actions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { user, response } = await getMobileUser(request);
  if (response || !user) return response || mobileJsonError("Non autorisé", 401);

  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action") || "getDashboard";
  const explicitSchoolId = Number(searchParams.get("schoolId")) || user?.schoolId || 9;

  try {
    if (action === "getDashboard") {
      const data = await getBoursesAndEcheanciersDashboardData(explicitSchoolId, user);
      return NextResponse.json({
        success: true,
        data: (data as any)?.data || data,
      });
    }

    return mobileJsonError("Action non supportée", 400);
  } catch (err: any) {
    console.error("[Mobile Bourses API GET Error]:", err);
    return mobileJsonError(`Erreur: ${err.message || err}`, 500);
  }
}

export async function POST(request: NextRequest) {
  const { user, response } = await getMobileUser(request);
  if (response || !user) return response || mobileJsonError("Non autorisé", 401);

  const roleType = await getUserRoleType(user);
  const userAny = user as any;
  const hasAccess = [
    "admin",
    "super_admin",
    "owner",
    "promoteur",
    "fondateur",
    "ministere",
    "director",
    "directeur",
    "general_director",
    "level_director",
    "level_comptable",
    "level_caissier",
    "comptable",
    "caissier",
    "staff",
  ].includes(roleType) ||
    Boolean(userAny.permissions?.includes("finance.collect")) ||
    Boolean(userAny.permissions?.includes("finance.view"));

  if (!hasAccess) {
    return mobileJsonError("Accès refusé. Privilèges financiers requis.", 403);
  }

  try {
    const body = await request.json();
    const { action, payload } = body;

    if (action === "triggerBulkReminders") {
      const res = await triggerBulkScheduleReminders(payload?.scheduleIds);
      return NextResponse.json(res);
    }

    if (action === "triggerSingleReminder") {
      const scheduleId = Number(payload?.scheduleId);
      if (!scheduleId) return mobileJsonError("scheduleId manquant", 400);
      const res = await triggerScheduleReminder(scheduleId);
      return NextResponse.json(res);
    }

    if (action === "recordSchedulePayment") {
      const scheduleId = Number(payload?.scheduleId);
      const amount = Number(payload?.amount);
      if (!scheduleId || !amount) return mobileJsonError("Paramètres invalides", 400);

      const res = await recordSchedulePayment(
        scheduleId,
        amount,
        payload?.paymentMode || "Espèces",
        payload?.reference
      );
      return NextResponse.json(res);
    }

    return mobileJsonError("Action non supportée", 400);
  } catch (err: any) {
    console.error("[Mobile Bourses API POST Error]:", err);
    return mobileJsonError(`Erreur: ${err.message || err}`, 500);
  }
}

