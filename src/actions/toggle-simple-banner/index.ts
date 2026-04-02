"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { simpleBannerTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type ToggleSimpleBannerInput,
  toggleSimpleBannerSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function toggleSimpleBanner(
  input: ToggleSimpleBannerInput,
): Promise<ActionResult> {
  const payload = toggleSimpleBannerSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  await db
    .update(simpleBannerTable)
    .set({ isActive: payload.data.isActive, updatedAt: new Date() })
    .where(eq(simpleBannerTable.id, payload.data.id));

  revalidatePath("/");
  revalidatePath("/admin/vitrine/banner-simples");

  return { success: true, message: "Status atualizado." };
}
