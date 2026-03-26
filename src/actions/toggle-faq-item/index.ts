"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { faqItemTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import { type ToggleFaqItemInput, toggleFaqItemSchema } from "./schema";

type ActionResult = { success: boolean; message: string };

export async function toggleFaqItem(
  input: ToggleFaqItemInput,
): Promise<ActionResult> {
  const payload = toggleFaqItemSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireAdminSessionOrThrow();

  await db
    .update(faqItemTable)
    .set({ isActive: payload.data.isActive, updatedAt: new Date() })
    .where(eq(faqItemTable.id, payload.data.id));

  revalidatePath("/");
  revalidatePath("/admin/configuracoes/footer");

  return {
    success: true,
    message: payload.data.isActive ? "Pergunta ativada." : "Pergunta desativada.",
  };
}
