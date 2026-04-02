"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { simpleBannerTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type UpdateSimpleBannerInput,
  updateSimpleBannerSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function updateSimpleBanner(
  input: UpdateSimpleBannerInput,
): Promise<ActionResult> {
  const payload = updateSimpleBannerSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  await db
    .update(simpleBannerTable)
    .set({
      imageUrl: payload.data.imageUrl,
      linkUrl: payload.data.linkUrl || null,
      isActive: payload.data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(simpleBannerTable.id, payload.data.id));

  revalidatePath("/");
  revalidatePath("/admin/vitrine/banner-simples");

  return { success: true, message: "Banner atualizado com sucesso." };
}
