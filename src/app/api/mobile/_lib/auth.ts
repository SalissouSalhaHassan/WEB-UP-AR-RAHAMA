import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { eq, or } from "drizzle-orm";

import { readDb } from "@/infrastructure/database";
import { users } from "@/infrastructure/database/schema/auth";
import { schoolBranches } from "@/infrastructure/database/schema/settings";
import { getUserRoleType, hasPermission, type PermissionAction } from "@/domains/auth/services/rbac";

export function mobileJsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

function getSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
    anonKey:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      "",
  };
}

function verifyAndParseJwtPayload(token: string): { payload: Record<string, any> | null; signatureVerified: boolean } {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return { payload: null, signatureVerified: false };
    const [headerB64, payloadB64, signatureB64] = parts;
    const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(base64, "base64").toString("utf-8");
    const payload = JSON.parse(json);

    // Verify HMAC signature for edut_server issued tokens
    if (payload?.iss === "edut_server") {
      const crypto = require("crypto");
      const sigSecret = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "edut_secure_secret";
      const expectedSig = crypto.createHmac("sha256", sigSecret).update(`${headerB64}.${payloadB64}`).digest("base64url");
      const altSecret = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "edut_secure_secret";
      const expectedAltSig = crypto.createHmac("sha256", altSecret).update(`${headerB64}.${payloadB64}`).digest("base64url");
      const verified = signatureB64 === expectedSig || signatureB64 === expectedAltSig;
      return { payload: verified ? payload : null, signatureVerified: verified };
    }

    return { payload, signatureVerified: false };
  } catch {
    return { payload: null, signatureVerified: false };
  }
}

export async function getMobileUser(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) {
    return { user: null, response: mobileJsonError("Token mobile manquant.", 401) };
  }

  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) {
    return { user: null, response: mobileJsonError("Configuration Supabase indisponible.", 500) };
  }

  const supabase = createSupabaseClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let authUser: { id: string; email?: string } | null = null;
  const { data } = await supabase.auth.getUser(token);
  if (data?.user) {
    authUser = data.user;
  } else {
    // Offline Grace Fallback:
    // If the mobile client is syncing operations that were queued offline,
    // the Supabase access token may have expired while without connectivity.
    const { payload, signatureVerified } = verifyAndParseJwtPayload(token);
    const now = Math.floor(Date.now() / 1000);
    // Allow up to 30 days offline grace period from token expiration
    const maxOfflineGraceSeconds = 30 * 24 * 60 * 60;
    const isWithinGrace = payload?.exp ? (now - payload.exp) < maxOfflineGraceSeconds : false;
    
    // Extract current Supabase project ref if available
    const configuredRefMatch = url.match(/https:\/\/([^.]+)\.supabase\.co/);
    const configuredRef = configuredRefMatch?.[1];

    const isProjectMatch = Boolean(
      payload && (
        signatureVerified ||
        (configuredRef && (payload.iss?.includes(configuredRef) || payload.ref === configuredRef))
      )
    );

    if (payload && (payload.sub || payload.email || payload.id) && isProjectMatch && isWithinGrace) {
      authUser = {
        id: payload.sub || `edut_${payload.id}`,
        email: payload.email,
      };
    } else {
      return { user: null, response: mobileJsonError("Session mobile invalide.", 401) };
    }
  }

  const email = authUser.email?.toLowerCase().trim() || "";
  const username = email.includes("@") ? email.split("@")[0] : email;

  const user = await readDb.query.users.findFirst({
    where: or(
      eq(users.supabaseId, authUser.id),
      email ? eq(users.utilisateur, email) : undefined,
      username ? eq(users.utilisateur, username) : undefined
    ),
    with: {
      role: {
        with: {
          permissions: true,
        },
      },
      school: true,
      employee: true,
      student: true,
    },
  });

  if (!user) {
    return { user: null, response: mobileJsonError("Compte non relie a un profil Edut.", 403) };
  }

  // Fallback: Resolve educational level from branch if not explicitly set on user
  if (!user.educationalLevel && user.schoolId) {
    try {
      const branch = await readDb.query.schoolBranches.findFirst({
        where: eq(schoolBranches.schoolId, user.schoolId),
        columns: { instType: true },
        orderBy: [schoolBranches.createdAt],
      });
      if (branch?.instType) {
        (user as any).educationalLevel = branch.instType;
      }
    } catch (_) {}
  }

  return { user, response: null };
}

export async function canUseMobileModule(
  user: NonNullable<Awaited<ReturnType<typeof getMobileUser>>["user"]>,
  moduleName: string,
  action: PermissionAction
) {
  const roleType = await getUserRoleType(user);
  if (roleType === "super_admin" || roleType === "ministere") return true;
  if (moduleName.toLowerCase() === "messaging" && (roleType === "teacher" || roleType === "enseignant")) {
    return action !== "canDelete";
  }
  if (["directeur", "general_director", "level_director", "dren", "dden", "inspection"].includes(roleType)) {
    return true;
  }
  return await hasPermission(user.id, moduleName, action);
}
