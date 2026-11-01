import { getStudentProfile } from "@/domains/students/actions/students.actions";
import { getStudentBehaviorRewards, getStudentCounselorNotes, getIncidents } from "@/domains/students/actions/discipline.actions";
import { getCurrentUser } from "@/domains/auth/services/session";
import { redirect } from "next/navigation";
import StudentProfileClient from "./StudentProfileClient";
import { LmdProgressionService } from "@/domains/academics/services/lmd-progression.service";
import { AIAnalyticsService } from "@/domains/ai/services/ai-analytics.service";

export const dynamic = "force-dynamic";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const studentId = parseInt(id);

  if (isNaN(studentId)) {
    redirect("/dashboard/students");
  }

  // 1. Fetch academic profile data
  const profileResult = await getStudentProfile(studentId);
  if (profileResult.error || !profileResult.data?.student) {
    redirect("/dashboard/students");
  }

  // 2. Fetch behavior rewards
  const rewardsResult = await getStudentBehaviorRewards(studentId);
  const rewards = rewardsResult?.data?.data || [];

  // 3. Fetch discipline incidents (filter for this student)
  const incidentsResult = await getIncidents();
  const allIncidents = incidentsResult?.data?.data || [];
  const studentIncidents = allIncidents.filter((inc: any) => inc.studentId === studentId);

  // 4. Fetch session and roles for counselor notes permission
  const currentUser = await getCurrentUser();
  
  // 5. Fetch counselor notes if role is authorized
  let counselorNotes: any[] = [];
  try {
    const notesResult = await getStudentCounselorNotes(studentId);
    if (notesResult && !notesResult.error) {
      counselorNotes = notesResult.data?.data || [];
    }
  } catch (e) {
    // Suppress error if not authorized (we handle showing/hiding tab in UI)
  }

  // 6. Fetch interactive LMD Progression Profile (for university / higher ed students)
  let lmdProfile = null;
  try {
    lmdProfile = await LmdProgressionService.getStudentProgression(studentId);
  } catch (e) {
    console.warn("Could not fetch LMD progression for student:", e);
  }

  // 7. Fetch AI Early Warning & Failure Risk Profile
  let aiRiskProfile = null;
  try {
    aiRiskProfile = await AIAnalyticsService.getStudentRiskProfile(studentId);
  } catch (e) {
    console.warn("Could not fetch AI risk profile for student:", e);
  }

  return (
    <StudentProfileClient
      currentUser={currentUser}
      student={profileResult.data.student}
      grades={profileResult.data.grades || []}
      remediations={profileResult.data.remediations || []}
      assignments={profileResult.data.assignments || []}
      rewards={rewards}
      incidents={studentIncidents}
      counselorNotes={counselorNotes}
      lmdProfile={lmdProfile}
      aiRiskProfile={aiRiskProfile}
    />
  );
}
