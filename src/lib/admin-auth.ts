import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { USER_ROLES, type UserRole } from "@/lib/admin-roles";
import { auth } from "@/lib/auth";
import { syncConfiguredSuperAdmin } from "@/lib/super-admin";

type SessionUserWithRole = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  image?: string | null;
};

const ADMIN_ROLE_SET = new Set<UserRole>([
  USER_ROLES.ADMIN,
  USER_ROLES.SUPER_ADMIN,
]);

function parseEmailList(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function normalizeUserRole(role: string | null | undefined): UserRole {
  if (role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN) {
    return role;
  }

  return USER_ROLES.CUSTOMER;
}

export function isAdminRole(role: string | null | undefined) {
  return ADMIN_ROLE_SET.has(normalizeUserRole(role));
}

export function isSuperAdminRole(role: string | null | undefined) {
  return normalizeUserRole(role) === USER_ROLES.SUPER_ADMIN;
}

export function getAdminRoleLabel(role: string | null | undefined) {
  if (normalizeUserRole(role) === USER_ROLES.SUPER_ADMIN) {
    return "Super Admin";
  }

  if (normalizeUserRole(role) === USER_ROLES.ADMIN) {
    return "Admin";
  }

  return "Cliente";
}

export function isAdminRegistrationConfigured() {
  return (
    Boolean(process.env.ADMIN_SIGNUP_KEY?.trim()) ||
    parseEmailList(process.env.ADMIN_ALLOWED_EMAILS).size > 0
  );
}

export function getAdminRegistrationRole(
  email: string,
  accessKey?: string | null,
) {
  const normalizedEmail = email.trim().toLowerCase();
  const allowedAdminEmails = parseEmailList(process.env.ADMIN_ALLOWED_EMAILS);

  if (allowedAdminEmails.has(normalizedEmail)) {
    return USER_ROLES.ADMIN;
  }

  const expectedKey = process.env.ADMIN_SIGNUP_KEY?.trim();

  if (expectedKey && accessKey?.trim() === expectedKey) {
    return USER_ROLES.ADMIN;
  }

  return null;
}

export async function getCurrentSessionWithRole() {
  await syncConfiguredSuperAdmin();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session?.user as SessionUserWithRole | undefined;

  return {
    session,
    user,
    role: normalizeUserRole(user?.role),
  };
}

export async function requireAdminSession() {
  const result = await getCurrentSessionWithRole();

  if (!result.session?.user || !isAdminRole(result.role)) {
    redirect("/admin?error=access-denied");
  }

  return result;
}

export async function requireSuperAdminSessionOrThrow() {
  const result = await getCurrentSessionWithRole();

  if (!result.session?.user || !isSuperAdminRole(result.role)) {
    throw new Error("Unauthorized");
  }

  return result;
}
