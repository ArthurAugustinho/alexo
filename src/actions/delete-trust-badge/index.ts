"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { trustBadgeTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type DeleteTrustBadgeInput,
  deleteTrustBadgeSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function deleteTrustBadge(
  input: DeleteTrustBadgeInput,
): Promise<ActionResult> {
  const payload = deleteTrustBadgeSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireAdminSessionOrThrow();

  await db
    .delete(trustBadgeTable)
    .where(eq(trustBadgeTable.id, payload.data.id));

  revalidatePath("/");
  revalidatePath("/admin/configuracoes/footer");

  return { success: true, message: "Selo excluído com sucesso." };
}
