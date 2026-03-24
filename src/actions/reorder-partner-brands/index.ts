"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { partnerBrandTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type ReorderPartnerBrandsInput,
  reorderPartnerBrandsSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function reorderPartnerBrands(
  input: ReorderPartnerBrandsInput,
): Promise<ActionResult> {
  const payload = reorderPartnerBrandsSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  await Promise.all(
    payload.data.items.map(({ id, position }) =>
      db
        .update(partnerBrandTable)
        .set({ position, updatedAt: new Date() })
        .where(eq(partnerBrandTable.id, id)),
    ),
  );

  revalidatePath("/");
  revalidatePath("/admin/vitrine/marcas");

  return { success: true, message: "Ordem atualizada com sucesso." };
}
