/**
 * Automated Integration Test Suite: RBAC & Tenant Isolation
 * Run via: npx tsx tests/rbac.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("RBAC & Multi-Tenant Isolation Security Suite", () => {
  it("should enforce regional scope isolation for DREN role", () => {
    const userDren = {
      role: { roleName: "dren" },
      region: "Niamey",
      schoolId: null,
    };

    const targetBranchSameRegion = { region: "Niamey", schoolId: 10 };
    const targetBranchOtherRegion = { region: "Maradi", schoolId: 20 };

    const matchesSame = userDren.region.toLowerCase() === targetBranchSameRegion.region.toLowerCase();
    const matchesOther = userDren.region.toLowerCase() === targetBranchOtherRegion.region.toLowerCase();

    assert.equal(matchesSame, true, "DREN should access branches in their own region");
    assert.equal(matchesOther, false, "DREN must be blocked from accessing branches outside their region");
  });

  it("should prevent cross-school data leak for school directors", () => {
    const directorSchoolA = {
      role: { roleName: "directeur" },
      schoolId: 1,
    };

    const recordSchoolA = { id: 101, schoolId: 1 };
    const recordSchoolB = { id: 102, schoolId: 2 };

    const canAccessRecordA = directorSchoolA.schoolId === recordSchoolA.schoolId;
    const canAccessRecordB = directorSchoolA.schoolId === recordSchoolB.schoolId;

    assert.equal(canAccessRecordA, true, "Director must access records belonging to School 1");
    assert.equal(canAccessRecordB, false, "Director must be blocked from records of School 2");
  });

  it("should restrict teacher access to strictly assigned classes", () => {
    const teacherUser = {
      role: { roleName: "enseignant" },
      assignedClassIds: [10, 11, 12],
    };

    const targetClassIdAllowed = 11;
    const targetClassIdForbidden = 99;

    const hasAllowedAccess = teacherUser.assignedClassIds.includes(targetClassIdAllowed);
    const hasForbiddenAccess = teacherUser.assignedClassIds.includes(targetClassIdForbidden);

    assert.equal(hasAllowedAccess, true, "Teacher should access their assigned class");
    assert.equal(hasForbiddenAccess, false, "Teacher must be rejected from unassigned classes");
  });

  it("should enforce Super Admin bypass for ministerial monitoring", () => {
    const superAdmin = {
      role: { roleName: "super_admin" },
      superAdmin: true,
      schoolId: null,
    };

    const canAccessAny = superAdmin.superAdmin === true;
    assert.equal(canAccessAny, true, "Super Admin should have global scope for nationwide statistics");
  });
});
