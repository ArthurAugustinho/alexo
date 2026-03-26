"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { trustBadgeTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type ToggleTrustBadgeInput,
  toggleTrustBadgeSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function toggleTrustBadge(
  input: ToggleTrustBadgeInput,
): Promise<ActionResult> {
  const payload = toggleTrustBadgeSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireAdminSessionOrThrow();

  await db
    .update(trustBadgeTable)
    .set({ isActive: payload.data.isActive, updatedAt: new Date() })
    .where(eq(trustBadgeTable.id, payload.data.id));

  revalidatePath("/");
  revalidatePath("/admin/configuracoes/footer");

  return {
    success: true,
    message: payload.data.isActive ? "Selo ativado." : "Selo desativado.",
  };
}
