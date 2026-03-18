"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  type DeleteBannerInput,
  deleteBannerSchema,
} from "@/actions/admin-showcase/schema";
import { db } from "@/db";
import { seasonalBannerTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

type DeleteAdminBannerResult = {
  success: boolean;
  message: string;
};

export async function deleteAdminBanner(
  input: DeleteBannerInput,
): Promise<DeleteAdminBannerResult> {
  const payload = deleteBannerSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Banner inválido.",
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
    .delete(seasonalBannerTable)
    .where(eq(seasonalBannerTable.id, existingBanner.id));

  revalidatePath("/");
  revalidatePath("/admin/vitrine/banners");

  return {
    success: true,
    message: "Banner excluído com sucesso.",
  };
}
