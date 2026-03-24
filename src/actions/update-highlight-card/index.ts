"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { highlightCardTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type UpdateHighlightCardInput,
  updateHighlightCardSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function updateHighlightCard(
  input: UpdateHighlightCardInput,
): Promise<ActionResult> {
  const payload = updateHighlightCardSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  const conflict = await db.query.highlightCardTable.findFirst({
    where: and(
      eq(highlightCardTable.position, payload.data.position),
      ne(highlightCardTable.id, payload.data.id),
    ),
  });

  if (conflict) {
    return {
      success: false,
      message: `Já existe um card na posição ${payload.data.position}.`,
    };
  }

  await db
    .update(highlightCardTable)
    .set({
      title: payload.data.title,
      imageUrl: payload.data.imageUrl,
      linkUrl: payload.data.linkUrl,
      position: payload.data.position,
      isActive: payload.data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(highlightCardTable.id, payload.data.id));

  revalidatePath("/");
  revalidatePath("/admin/vitrine/destaques");

  return { success: true, message: "Destaque atualizado com sucesso." };
}
