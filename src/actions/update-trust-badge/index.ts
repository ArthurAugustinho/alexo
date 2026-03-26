"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { trustBadgeTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type UpdateTrustBadgeInput,
  updateTrustBadgeSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function updateTrustBadge(
  input: UpdateTrustBadgeInput,
): Promise<ActionResult> {
  const payload = updateTrustBadgeSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireAdminSessionOrThrow();

  await db
    .update(trustBadgeTable)
    .set({
      label: payload.data.label,
      imageUrl: payload.data.imageUrl,
      linkUrl: payload.data.linkUrl || null,
      isActive: payload.data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(trustBadgeTable.id, payload.data.id));

  revalidatePath("/");
  revalidatePath("/admin/configuracoes/footer");

  return { success: true, message: "Selo atualizado com sucesso." };
}
