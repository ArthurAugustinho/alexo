"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { faqItemTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import { type ReorderFaqItemsInput, reorderFaqItemsSchema } from "./schema";

type ActionResult = { success: boolean; message: string };

export async function reorderFaqItems(
  input: ReorderFaqItemsInput,
): Promise<ActionResult> {
  const payload = reorderFaqItemsSchema.safeParse(input);
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
        .update(faqItemTable)
        .set({ position: item.position, updatedAt: new Date() })
        .where(eq(faqItemTable.id, item.id));
    }
  });

  revalidatePath("/");
  revalidatePath("/admin/configuracoes/footer");

  return { success: true, message: "Ordem atualizada com sucesso." };
}
