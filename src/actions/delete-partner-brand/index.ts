"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { partnerBrandTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type DeletePartnerBrandInput,
  deletePartnerBrandSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function deletePartnerBrand(
  input: DeletePartnerBrandInput,
): Promise<ActionResult> {
  const payload = deletePartnerBrandSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  await db
    .delete(partnerBrandTable)
    .where(eq(partnerBrandTable.id, payload.data.id));

  revalidatePath("/");
  revalidatePath("/admin/vitrine/marcas");

  return { success: true, message: "Marca excluída com sucesso." };
}
