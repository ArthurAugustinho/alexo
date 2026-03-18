"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { productTable, productVariantTable } from "@/db/schema";
import { requireAdminSession } from "@/lib/admin-auth";
import { generateSlug } from "@/lib/slug";

import {
  type AdminProductInput,
  adminProductSchema,
} from "../admin-product/schema";

type AdminProductActionResult = {
  success: boolean;
  message: string;
};

async function getUniqueProductSlug(name: string, excludeProductId?: string) {
  const baseSlug = generateSlug(name) || "produto";
  let attempt = 0;

  while (true) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const existingProduct = await db.query.productTable.findFirst({
      where: eq(productTable.slug, candidate),
    });

    if (!existingProduct || existingProduct.id === excludeProductId) {
      return candidate;
    }

    attempt += 1;
  }
}

async function getUniqueVariantSlug(name: string, excludeVariantId?: string) {
  const baseSlug = generateSlug(name) || "variacao";
  let attempt = 0;

  while (true) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const existingVariant = await db.query.productVariantTable.findFirst({
      where: eq(productVariantTable.slug, candidate),
    });

    if (!existingVariant || existingVariant.id === excludeVariantId) {
      return candidate;
    }

    attempt += 1;
  }
}

export async function updateAdminProduct(
  input: AdminProductInput,
): Promise<AdminProductActionResult> {
  const payload = adminProductSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inv\u00e1lidos.",
    };
  }

  if (!payload.data.productId) {
    return {
      success: false,
      message: "Produto inv\u00e1lido.",
    };
  }

  await requireAdminSession();

  const existingProduct = await db.query.productTable.findFirst({
    where: eq(productTable.id, payload.data.productId),
    with: {
      variants: {
        orderBy: [asc(productVariantTable.createdAt)],
      },
    },
  });

  if (!existingProduct) {
    return {
      success: false,
      message: "Produto n\u00e3o encontrado.",
    };
  }

  const primaryVariant =
    existingProduct.variants.find(
      (variant) => variant.id === payload.data.primaryVariantId,
    ) ?? existingProduct.variants[0];

  const productSlug =
    existingProduct.name === payload.data.name
      ? existingProduct.slug
      : await getUniqueProductSlug(payload.data.name, existingProduct.id);

  const variantSlug =
    primaryVariant &&
    primaryVariant.color === payload.data.variantColor &&
    primaryVariant.name === payload.data.variantName
      ? primaryVariant.slug
      : await getUniqueVariantSlug(
          `${payload.data.name}-${payload.data.variantColor}`,
          primaryVariant?.id,
        );

  await db.transaction(async (tx) => {
    await tx
      .update(productTable)
      .set({
        categoryId: payload.data.categoryId,
        name: payload.data.name,
        description: payload.data.description,
        slug: productSlug,
        shippingCostInCents: Math.round(payload.data.shippingCostInReais * 100),
      })
      .where(eq(productTable.id, existingProduct.id));

    if (primaryVariant) {
      await tx
        .update(productVariantTable)
        .set({
          name: payload.data.variantName,
          color: payload.data.variantColor,
          imageUrl: payload.data.imageUrl,
          priceInCents: Math.round(payload.data.priceInReais * 100),
          slug: variantSlug,
        })
        .where(eq(productVariantTable.id, primaryVariant.id));

      return;
    }

    await tx.insert(productVariantTable).values({
      productId: existingProduct.id,
      name: payload.data.variantName,
      color: payload.data.variantColor,
      imageUrl: payload.data.imageUrl,
      priceInCents: Math.round(payload.data.priceInReais * 100),
      slug: variantSlug,
    });
  });

  revalidatePath("/");
  revalidatePath("/admin/dashboard");

  return {
    success: true,
    message: "Produto atualizado com sucesso.",
  };
}
