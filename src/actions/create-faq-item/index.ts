"use server";

import { desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { faqItemTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import { type CreateFaqItemInput, createFaqItemSchema } from "./schema";

type ActionResult = { success: boolean; message: string };

export async function createFaqItem(
  input: CreateFaqItemInput,
): Promise<ActionResult> {
  const payload = createFaqItemSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireAdminSessionOrThrow();

  const last = await db.query.faqItemTable.findFirst({
    orderBy: [desc(faqItemTable.position)],
  });
  const nextPosition = last ? last.position + 1 : 0;

  await db.insert(faqItemTable).values({
    question: payload.data.question,
    answer: payload.data.answer,
    isActive: payload.data.isActive,
    position: nextPosition,
  });

  revalidatePath("/");
  revalidatePath("/admin/configuracoes/footer");

  return { success: true, message: "Pergunta criada com sucesso." };
}
