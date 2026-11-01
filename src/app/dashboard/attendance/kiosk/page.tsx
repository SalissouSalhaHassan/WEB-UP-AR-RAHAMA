import { Metadata } from "next";
import { getGateTodayStatsAction } from "@/domains/attendance/actions/kiosk.actions";
import GateAttendanceKioskClient from "./GateAttendanceKioskClient";

export const metadata: Metadata = {
  title: "Borne de Pointage Portail (Mode Kiosk) • U.P.R / UPIAI",
  description: "Mode Borne Kiosk plein écran pour le contrôle d'accès et pointage au portail d'entrée par badge et QR Code",
};

export const dynamic = "force-dynamic";

export default async function GateAttendanceKioskPage() {
  const statsRes = await getGateTodayStatsAction();
  const initialStats = statsRes.success && statsRes.data ? statsRes.data : { totalScanned: 0, onTimeCount: 0, lateCount: 0 };

  return <GateAttendanceKioskClient initialStats={initialStats} />;
}
