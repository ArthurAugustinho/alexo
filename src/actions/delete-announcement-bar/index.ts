"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { announcementBarTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type DeleteAnnouncementBarInput,
  deleteAnnouncementBarSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function deleteAnnouncementBar(
  input: DeleteAnnouncementBarInput,
): Promise<ActionResult> {
  const payload = deleteAnnouncementBarSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  await db
    .delete(announcementBarTable)
    .where(eq(announcementBarTable.id, payload.data.id));

  revalidatePath("/");
  revalidatePath("/admin/vitrine/avisos");

  return { success: true, message: "Aviso excluído com sucesso." };
}
