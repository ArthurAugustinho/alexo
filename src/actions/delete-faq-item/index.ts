"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { faqItemTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import { type DeleteFaqItemInput, deleteFaqItemSchema } from "./schema";

type ActionResult = { success: boolean; message: string };

export async function deleteFaqItem(
  input: DeleteFaqItemInput,
): Promise<ActionResult> {
  const payload = deleteFaqItemSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireAdminSessionOrThrow();

  await db.delete(faqItemTable).where(eq(faqItemTable.id, payload.data.id));

  revalidatePath("/");
  revalidatePath("/admin/configuracoes/footer");

  return { success: true, message: "Pergunta excluída com sucesso." };
}
