"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { tripleImageGridItemTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type ToggleTripleImageItemInput,
  toggleTripleImageItemSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function toggleTripleImageItem(
  input: ToggleTripleImageItemInput,
): Promise<ActionResult> {
  const payload = toggleTripleImageItemSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  await db
    .update(tripleImageGridItemTable)
    .set({ isActive: payload.data.isActive, updatedAt: new Date() })
    .where(eq(tripleImageGridItemTable.id, payload.data.id));

  revalidatePath("/");
  revalidatePath("/admin/vitrine/grade-imagens");

  return { success: true, message: "Status atualizado." };
}
