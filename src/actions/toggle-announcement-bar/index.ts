"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { announcementBarTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type ToggleAnnouncementBarInput,
  toggleAnnouncementBarSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function toggleAnnouncementBar(
  input: ToggleAnnouncementBarInput,
): Promise<ActionResult> {
  const payload = toggleAnnouncementBarSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  await db
    .update(announcementBarTable)
    .set({ isActive: payload.data.isActive, updatedAt: new Date() })
    .where(eq(announcementBarTable.id, payload.data.id));

  revalidatePath("/");
  revalidatePath("/admin/vitrine/avisos");

  return {
    success: true,
    message: payload.data.isActive ? "Aviso ativado." : "Aviso desativado.",
  };
}
