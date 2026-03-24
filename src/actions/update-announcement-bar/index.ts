"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { announcementBarTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type UpdateAnnouncementBarInput,
  updateAnnouncementBarSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function updateAnnouncementBar(
  input: UpdateAnnouncementBarInput,
): Promise<ActionResult> {
  const payload = updateAnnouncementBarSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  const existing = await db.query.announcementBarTable.findFirst({
    where: eq(announcementBarTable.id, payload.data.id),
  });
  if (!existing) {
    return { success: false, message: "Aviso não encontrado." };
  }

  await db
    .update(announcementBarTable)
    .set({
      text: payload.data.text,
      linkUrl: payload.data.linkUrl || null,
      bgColor: payload.data.bgColor,
      textColor: payload.data.textColor,
      isActive: payload.data.isActive,
      startDate: payload.data.startDate
        ? new Date(payload.data.startDate)
        : null,
      endDate: payload.data.endDate ? new Date(payload.data.endDate) : null,
      updatedAt: new Date(),
    })
    .where(eq(announcementBarTable.id, payload.data.id));

  revalidatePath("/");
  revalidatePath("/admin/vitrine/avisos");

  return { success: true, message: "Aviso atualizado com sucesso." };
}
