"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { simpleBannerTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type DeleteSimpleBannerInput,
  deleteSimpleBannerSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function deleteSimpleBanner(
  input: DeleteSimpleBannerInput,
): Promise<ActionResult> {
  const payload = deleteSimpleBannerSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  await db
    .delete(simpleBannerTable)
    .where(eq(simpleBannerTable.id, payload.data.id));

  revalidatePath("/");
  revalidatePath("/admin/vitrine/banner-simples");

  return { success: true, message: "Banner excluído com sucesso." };
}
