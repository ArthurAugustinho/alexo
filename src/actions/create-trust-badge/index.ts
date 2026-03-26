"use server";

import { desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { trustBadgeTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type CreateTrustBadgeInput,
  createTrustBadgeSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function createTrustBadge(
  input: CreateTrustBadgeInput,
): Promise<ActionResult> {
  const payload = createTrustBadgeSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireAdminSessionOrThrow();

  const last = await db.query.trustBadgeTable.findFirst({
    orderBy: [desc(trustBadgeTable.position)],
  });
  const nextPosition = last ? last.position + 1 : 0;

  await db.insert(trustBadgeTable).values({
    label: payload.data.label,
    imageUrl: payload.data.imageUrl,
    linkUrl: payload.data.linkUrl || null,
    isActive: payload.data.isActive,
    position: nextPosition,
  });

  revalidatePath("/");
  revalidatePath("/admin/configuracoes/footer");

  return { success: true, message: "Selo criado com sucesso." };
}
