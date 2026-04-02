"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { tripleImageGridItemTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type UpsertTripleImageItemInput,
  upsertTripleImageItemSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function upsertTripleImageItem(
  input: UpsertTripleImageItemInput,
): Promise<ActionResult> {
  const payload = upsertTripleImageItemSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  const now = new Date();

  await db
    .insert(tripleImageGridItemTable)
    .values({
      imageUrl: payload.data.imageUrl,
      linkUrl: payload.data.linkUrl || null,
      position: payload.data.position,
      isActive: payload.data.isActive,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: tripleImageGridItemTable.position,
      set: {
        imageUrl: payload.data.imageUrl,
        linkUrl: payload.data.linkUrl || null,
        isActive: payload.data.isActive,
        updatedAt: now,
      },
    });

  revalidatePath("/");
  revalidatePath("/admin/vitrine/grade-imagens");

  return { success: true, message: "Grade atualizada com sucesso." };
}
