"use server";

import { desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { announcementBarTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type CreateAnnouncementBarInput,
  createAnnouncementBarSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function createAnnouncementBar(
  input: CreateAnnouncementBarInput,
): Promise<ActionResult> {
  const payload = createAnnouncementBarSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  const lastBar = await db.query.announcementBarTable.findFirst({
    orderBy: [desc(announcementBarTable.position)],
  });
  const nextPosition = lastBar ? lastBar.position + 1 : 0;

  await db.insert(announcementBarTable).values({
    text: payload.data.text,
    linkUrl: payload.data.linkUrl || null,
    bgColor: payload.data.bgColor,
    textColor: payload.data.textColor,
    isActive: payload.data.isActive,
    startDate: payload.data.startDate ? new Date(payload.data.startDate) : null,
    endDate: payload.data.endDate ? new Date(payload.data.endDate) : null,
    position: nextPosition,
  });

  revalidatePath("/");
  revalidatePath("/admin/vitrine/avisos");

  return { success: true, message: "Aviso criado com sucesso." };
}
