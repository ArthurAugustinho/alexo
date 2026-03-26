"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { supportWidgetConfigTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type UpsertSupportWidgetInput,
  upsertSupportWidgetSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function upsertSupportWidget(
  input: UpsertSupportWidgetInput,
): Promise<ActionResult> {
  const payload = upsertSupportWidgetSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireAdminSessionOrThrow();

  const existing = await db.query.supportWidgetConfigTable.findFirst();

  if (existing) {
    await db
      .update(supportWidgetConfigTable)
      .set({
        whatsappNumber: payload.data.whatsappNumber || null,
        whatsappMessage: payload.data.whatsappMessage || null,
        supportEmail: payload.data.supportEmail || null,
        isActive: payload.data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(supportWidgetConfigTable.id, existing.id));
  } else {
    await db.insert(supportWidgetConfigTable).values({
      whatsappNumber: payload.data.whatsappNumber || null,
      whatsappMessage: payload.data.whatsappMessage || null,
      supportEmail: payload.data.supportEmail || null,
      isActive: payload.data.isActive,
    });
  }

  revalidatePath("/");
  revalidatePath("/admin/configuracoes/atendimento");

  return { success: true, message: "Configurações salvas com sucesso." };
}
