"use server";

import { protectedDbAction } from "@/lib/protected-action";
import { LmdProgressionService, StudentLmdProgressionProfile } from "../services/lmd-progression.service";
import { db } from "@/infrastructure/database";
import { students } from "@/infrastructure/database/schema/students";
import { eq, or, ilike } from "drizzle-orm";
import { getActiveSchoolId } from "@/domains/auth/services/school";

/**
 * Server action to get interactive LMD graduation progression for a single student.
 */
export async function getStudentLmdProgressionAction(studentId: number) {
  return protectedDbAction("Students", "canView", async () => {
    const profile = await LmdProgressionService.getStudentProgression(studentId);
    if (!profile) {
      return { error: "Profil LMD introuvable ou élève non enregistré." };
    }
    return { data: profile };
  });
}

/**
 * Server action to get overview list of university students with their LMD progression.
 */
export async function getAllUniversityStudentsProgressionAction() {
  return protectedDbAction("Students", "canView", async () => {
    const schoolId = await getActiveSchoolId();

    // Fetch university / higher education students
    const univStudents = await db.query.students.findMany({
      where: eq(students.schoolId, schoolId),
      limit: 60,
    });

    const progressionList: StudentLmdProgressionProfile[] = [];

    for (const st of univStudents) {
      const prof = await LmdProgressionService.getStudentProgression(st.id);
      if (prof) {
        progressionList.push(prof);
      }
    }

    return { data: progressionList };
  });
}
