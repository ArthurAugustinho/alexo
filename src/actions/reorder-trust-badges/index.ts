"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { trustBadgeTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type ReorderTrustBadgesInput,
  reorderTrustBadgesSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function reorderTrustBadges(
  input: ReorderTrustBadgesInput,
): Promise<ActionResult> {
  const payload = reorderTrustBadgesSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireAdminSessionOrThrow();

  await db.transaction(async (tx) => {
    for (const item of payload.data.items) {
      await tx
        .update(trustBadgeTable)
        .set({ position: item.position, updatedAt: new Date() })
        .where(eq(trustBadgeTable.id, item.id));
    }
  });

  revalidatePath("/");
  revalidatePath("/admin/configuracoes/footer");

  return { success: true, message: "Ordem atualizada com sucesso." };
}
