"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { highlightCardTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type DeleteHighlightCardInput,
  deleteHighlightCardSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function deleteHighlightCard(
  input: DeleteHighlightCardInput,
): Promise<ActionResult> {
  const payload = deleteHighlightCardSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  await db
    .delete(highlightCardTable)
    .where(eq(highlightCardTable.id, payload.data.id));

  revalidatePath("/");
  revalidatePath("/admin/vitrine/destaques");

  return { success: true, message: "Destaque excluído com sucesso." };
}
