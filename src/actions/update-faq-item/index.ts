"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { faqItemTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import { type UpdateFaqItemInput, updateFaqItemSchema } from "./schema";

type ActionResult = { success: boolean; message: string };

export async function updateFaqItem(
  input: UpdateFaqItemInput,
): Promise<ActionResult> {
  const payload = updateFaqItemSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireAdminSessionOrThrow();

  await db
    .update(faqItemTable)
    .set({
      question: payload.data.question,
      answer: payload.data.answer,
      isActive: payload.data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(faqItemTable.id, payload.data.id));

  revalidatePath("/");
  revalidatePath("/admin/configuracoes/footer");

  return { success: true, message: "Pergunta atualizada com sucesso." };
}
