"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { partnerBrandTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type UpdatePartnerBrandInput,
  updatePartnerBrandSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function updatePartnerBrand(
  input: UpdatePartnerBrandInput,
): Promise<ActionResult> {
  const payload = updatePartnerBrandSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  await db
    .update(partnerBrandTable)
    .set({
      name: payload.data.name,
      logoUrl: payload.data.logoUrl,
      linkUrl: payload.data.linkUrl || null,
      isActive: payload.data.isActive,
      position: payload.data.position,
      updatedAt: new Date(),
    })
    .where(eq(partnerBrandTable.id, payload.data.id));

  revalidatePath("/");
  revalidatePath("/admin/vitrine/marcas");

  return { success: true, message: "Marca atualizada com sucesso." };
}
