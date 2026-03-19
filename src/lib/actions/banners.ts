"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { seasonalBannerTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";
import {
  type AdminBannerInput,
  adminBannerSchema,
  type DeleteBannerInput,
  deleteBannerSchema,
} from "@/lib/admin-showcase-schema";

type AdminBannerActionResult = {
  success: boolean;
  message: string;
};

type DeleteAdminBannerResult = {
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
      message: payload.error.issues[0]?.message ?? "Dados invÃ¡lidos.",
    };
  }

  if (payload.data.startDate >= payload.data.endDate) {
    return {
      success: false,
      message: "A data final precisa ser posterior Ã  data inicial.",
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

export async function updateAdminBanner(
  input: AdminBannerInput,
): Promise<AdminBannerActionResult> {
  const payload = adminBannerSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados invÃ¡lidos.",
    };
  }

  if (!payload.data.bannerId) {
    return {
      success: false,
      message: "Banner invÃ¡lido.",
    };
  }

  if (payload.data.startDate >= payload.data.endDate) {
    return {
      success: false,
      message: "A data final precisa ser posterior Ã  data inicial.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  const existingBanner = await db.query.seasonalBannerTable.findFirst({
    where: eq(seasonalBannerTable.id, payload.data.bannerId),
  });

  if (!existingBanner) {
    return {
      success: false,
      message: "Banner nÃ£o encontrado.",
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

export async function deleteAdminBanner(
  input: DeleteBannerInput,
): Promise<DeleteAdminBannerResult> {
  const payload = deleteBannerSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Banner invÃ¡lido.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  const existingBanner = await db.query.seasonalBannerTable.findFirst({
    where: eq(seasonalBannerTable.id, payload.data.bannerId),
  });

  if (!existingBanner) {
    return {
      success: false,
      message: "Banner nÃ£o encontrado.",
    };
  }

  await db
    .delete(seasonalBannerTable)
    .where(eq(seasonalBannerTable.id, existingBanner.id));

  revalidatePath("/");
  revalidatePath("/admin/vitrine/banners");

  return {
    success: true,
    message: "Banner excluÃ­do com sucesso.",
  };
}
