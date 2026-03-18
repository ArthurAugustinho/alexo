"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  type ReorderFeaturedProductsInput,
  reorderFeaturedProductsSchema,
} from "@/actions/admin-showcase/schema";
import { db } from "@/db";
import { featuredProductTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

type FeaturedProductActionResult = {
  success: boolean;
  message: string;
};

export async function reorderAdminFeaturedProducts(
  input: ReorderFeaturedProductsInput,
): Promise<FeaturedProductActionResult> {
  const payload = reorderFeaturedProductsSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Ordenação inválida.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  const uniqueIds = new Set(payload.data.items.map((item) => item.id));

  if (uniqueIds.size !== payload.data.items.length) {
    return {
      success: false,
      message: "A ordenação contém itens duplicados.",
    };
  }

  const existingItems = await db.query.featuredProductTable.findMany();

  if (existingItems.length !== payload.data.items.length) {
    return {
      success: false,
      message: "A lista de destaque mudou. Atualize a página e tente novamente.",
    };
  }

  const existingIds = new Set(existingItems.map((item) => item.id));

  if (payload.data.items.some((item) => !existingIds.has(item.id))) {
    return {
      success: false,
      message: "A lista de destaque contém itens inválidos.",
    };
  }

  await db.transaction(async (tx) => {
    for (const item of payload.data.items) {
      await tx
        .update(featuredProductTable)
        .set({ position: item.position })
        .where(eq(featuredProductTable.id, item.id));
    }
  });

  revalidatePath("/");
  revalidatePath("/admin/vitrine/mais-vendidos");

  return {
    success: true,
    message: "Ordem da vitrine atualizada com sucesso.",
  };
}
