"use server";

import { desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { partnerBrandTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type CreatePartnerBrandInput,
  createPartnerBrandSchema,
} from "./schema";

type ActionResult = { success: boolean; message: string };

export async function createPartnerBrand(
  input: CreatePartnerBrandInput,
): Promise<ActionResult> {
  const payload = createPartnerBrandSchema.safeParse(input);
  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  const last = await db.query.partnerBrandTable.findFirst({
    orderBy: [desc(partnerBrandTable.position)],
  });
  const nextPosition = last ? last.position + 1 : 0;

  await db.insert(partnerBrandTable).values({
    name: payload.data.name,
    logoUrl: payload.data.logoUrl,
    linkUrl: payload.data.linkUrl || null,
    isActive: payload.data.isActive,
    position: nextPosition,
  });

  revalidatePath("/");
  revalidatePath("/admin/vitrine/marcas");

  return { success: true, message: "Marca criada com sucesso." };
}
