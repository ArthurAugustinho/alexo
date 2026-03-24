"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { announcementBarTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type ReorderAnnouncementBarsInput,
  reorderAnnouncementBarsSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function reorderAnnouncementBars(
  input: ReorderAnnouncementBarsInput,
): Promise<ActionResult> {
  const payload = reorderAnnouncementBarsSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  await db.transaction(async (tx) => {
    for (const item of payload.data.items) {
      await tx
        .update(announcementBarTable)
        .set({ position: item.position, updatedAt: new Date() })
        .where(eq(announcementBarTable.id, item.id));
    }
  });

  revalidatePath("/");
  revalidatePath("/admin/vitrine/avisos");

  return { success: true, message: "Ordem atualizada." };
}
