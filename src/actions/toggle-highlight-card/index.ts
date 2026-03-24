"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { highlightCardTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type ToggleHighlightCardInput,
  toggleHighlightCardSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function toggleHighlightCard(
  input: ToggleHighlightCardInput,
): Promise<ActionResult> {
  const payload = toggleHighlightCardSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  await db
    .update(highlightCardTable)
    .set({ isActive: payload.data.isActive, updatedAt: new Date() })
    .where(eq(highlightCardTable.id, payload.data.id));

  revalidatePath("/");
  revalidatePath("/admin/vitrine/destaques");

  return { success: true, message: "Status atualizado." };
}
