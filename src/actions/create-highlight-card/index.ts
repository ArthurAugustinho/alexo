"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { highlightCardTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type CreateHighlightCardInput,
  createHighlightCardSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function createHighlightCard(
  input: CreateHighlightCardInput,
): Promise<ActionResult> {
  const payload = createHighlightCardSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  const existing = await db.query.highlightCardTable.findFirst({
    where: eq(highlightCardTable.position, payload.data.position),
  });

  if (existing) {
    return {
      success: false,
      message: `Já existe um card na posição ${payload.data.position}.`,
    };
  }

  await db.insert(highlightCardTable).values({
    title: payload.data.title,
    imageUrl: payload.data.imageUrl,
    linkUrl: payload.data.linkUrl,
    position: payload.data.position,
    isActive: payload.data.isActive,
  });

  revalidatePath("/");
  revalidatePath("/admin/vitrine/destaques");

  return { success: true, message: "Destaque criado com sucesso." };
}
