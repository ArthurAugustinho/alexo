"use server";

import { revalidatePath } from "next/cache";

import {
  type AdminBannerInput,
  adminBannerSchema,
} from "@/actions/admin-showcase/schema";
import { db } from "@/db";
import { seasonalBannerTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

type AdminBannerActionResult = {
  success: boolean;
  message: string;
};

export async function createAdminBanner(
  input: AdminBannerInput,
): Promise<AdminBannerActionResult> {
  const payload = adminBannerSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  if (payload.data.startDate >= payload.data.endDate) {
    return {
      success: false,
      message: "A data final precisa ser posterior à data inicial.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  const now = new Date();

  await db.insert(seasonalBannerTable).values({
    imageUrl: payload.data.imageUrl,
    title: payload.data.title,
    subtitle: payload.data.subtitle,
    linkUrl: payload.data.linkUrl,
    startDate: payload.data.startDate,
    endDate: payload.data.endDate,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/");
  revalidatePath("/admin/vitrine/banners");

  return {
    success: true,
    message: "Banner criado com sucesso.",
  };
}
