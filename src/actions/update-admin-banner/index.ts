"use server";

import { eq } from "drizzle-orm";
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

export async function updateAdminBanner(
  input: AdminBannerInput,
): Promise<AdminBannerActionResult> {
  const payload = adminBannerSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  if (!payload.data.bannerId) {
    return {
      success: false,
      message: "Banner inválido.",
    };
  }

  if (payload.data.startDate >= payload.data.endDate) {
    return {
      success: false,
      message: "A data final precisa ser posterior à data inicial.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  const existingBanner = await db.query.seasonalBannerTable.findFirst({
    where: eq(seasonalBannerTable.id, payload.data.bannerId),
  });

  if (!existingBanner) {
    return {
      success: false,
      message: "Banner não encontrado.",
    };
  }

  await db
    .update(seasonalBannerTable)
    .set({
      imageUrl: payload.data.imageUrl,
      title: payload.data.title,
      subtitle: payload.data.subtitle,
      linkUrl: payload.data.linkUrl,
      startDate: payload.data.startDate,
      endDate: payload.data.endDate,
      updatedAt: new Date(),
    })
    .where(eq(seasonalBannerTable.id, existingBanner.id));

  revalidatePath("/");
  revalidatePath("/admin/vitrine/banners");

  return {
    success: true,
    message: "Banner atualizado com sucesso.",
  };
}
