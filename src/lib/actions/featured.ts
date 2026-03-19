"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { featuredProductTable, productTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";
import {
  type AddFeaturedProductInput,
  addFeaturedProductSchema,
  type RemoveFeaturedProductInput,
  removeFeaturedProductSchema,
  type ReorderFeaturedProductsInput,
  reorderFeaturedProductsSchema,
} from "@/lib/admin-showcase-schema";

type FeaturedProductActionResult = {
  success: boolean;
  message: string;
};

export async function addAdminFeaturedProduct(
  input: AddFeaturedProductInput,
): Promise<FeaturedProductActionResult> {
  const payload = addFeaturedProductSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Produto invÃ¡lido.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  const existingProduct = await db.query.productTable.findFirst({
    where: eq(productTable.id, payload.data.productId),
  });

  if (!existingProduct) {
    return {
      success: false,
      message: "Produto nÃ£o encontrado.",
    };
  }

  const featuredProducts = await db.query.featuredProductTable.findMany({
    orderBy: [asc(featuredProductTable.position)],
  });

  if (featuredProducts.some((item) => item.productId === payload.data.productId)) {
    return {
      success: false,
      message: "Esse produto jÃ¡ estÃ¡ na lista de destaque.",
    };
  }

  if (featuredProducts.length >= 10) {
    return {
      success: false,
      message: "A lista de destaque aceita no mÃ¡ximo 10 produtos.",
    };
  }

  await db.insert(featuredProductTable).values({
    productId: payload.data.productId,
    position: featuredProducts.length,
  });

  revalidatePath("/");
  revalidatePath("/admin/vitrine/mais-vendidos");

  return {
    success: true,
    message: "Produto adicionado Ã  curadoria manual.",
  };
}

export async function removeAdminFeaturedProduct(
  input: RemoveFeaturedProductInput,
): Promise<FeaturedProductActionResult> {
  const payload = removeFeaturedProductSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message:
        payload.error.issues[0]?.message ?? "Item destacado invÃ¡lido.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  const existingItem = await db.query.featuredProductTable.findFirst({
    where: eq(featuredProductTable.id, payload.data.featuredProductId),
  });

  if (!existingItem) {
    return {
      success: false,
      message: "Item destacado nÃ£o encontrado.",
    };
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(featuredProductTable)
      .where(eq(featuredProductTable.id, existingItem.id));

    const remainingItems = await tx.query.featuredProductTable.findMany({
      orderBy: [asc(featuredProductTable.position)],
    });

    for (const [index, item] of remainingItems.entries()) {
      await tx
        .update(featuredProductTable)
        .set({ position: index })
        .where(eq(featuredProductTable.id, item.id));
    }
  });

  revalidatePath("/");
  revalidatePath("/admin/vitrine/mais-vendidos");

  return {
    success: true,
    message: "Produto removido da curadoria manual.",
  };
}

export async function reorderAdminFeaturedProducts(
  input: ReorderFeaturedProductsInput,
): Promise<FeaturedProductActionResult> {
  const payload = reorderFeaturedProductsSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "OrdenaÃ§Ã£o invÃ¡lida.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  const uniqueIds = new Set(payload.data.items.map((item) => item.id));

  if (uniqueIds.size !== payload.data.items.length) {
    return {
      success: false,
      message: "A ordenaÃ§Ã£o contÃ©m itens duplicados.",
    };
  }

  const existingItems = await db.query.featuredProductTable.findMany();

  if (existingItems.length !== payload.data.items.length) {
    return {
      success: false,
      message: "A lista de destaque mudou. Atualize a pÃ¡gina e tente novamente.",
    };
  }

  const existingIds = new Set(existingItems.map((item) => item.id));

  if (payload.data.items.some((item) => !existingIds.has(item.id))) {
    return {
      success: false,
      message: "A lista de destaque contÃ©m itens invÃ¡lidos.",
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
