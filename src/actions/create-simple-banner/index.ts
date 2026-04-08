"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { simpleBannerTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type CreateSimpleBannerInput,
  createSimpleBannerSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function createSimpleBanner(
  input: CreateSimpleBannerInput,
): Promise<ActionResult> {
  const payload = createSimpleBannerSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  const now = new Date();

  await db.insert(simpleBannerTable).values({
    imageUrl: payload.data.imageUrl,
    mobileImageUrl: payload.data.mobileImageUrl || null,
    linkUrl: payload.data.linkUrl || null,
    isActive: payload.data.isActive,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/");
  revalidatePath("/admin/vitrine/banner-simples");

  return { success: true, message: "Banner criado com sucesso." };
}
