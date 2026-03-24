"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { partnerBrandTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type TogglePartnerBrandInput,
  togglePartnerBrandSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function togglePartnerBrand(
  input: TogglePartnerBrandInput,
): Promise<ActionResult> {
  const payload = togglePartnerBrandSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  await db
    .update(partnerBrandTable)
    .set({ isActive: payload.data.isActive, updatedAt: new Date() })
    .where(eq(partnerBrandTable.id, payload.data.id));

  revalidatePath("/");
  revalidatePath("/admin/vitrine/marcas");

  return { success: true, message: "Status atualizado." };
}
