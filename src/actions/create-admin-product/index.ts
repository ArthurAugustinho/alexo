"use server";

import { eq } from "drizzle-orm";
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

async function getUniqueProductSlug(name: string) {
  const baseSlug = generateSlug(name) || "produto";
  let attempt = 0;

  while (true) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const existingProduct = await db.query.productTable.findFirst({
      where: eq(productTable.slug, candidate),
    });

    if (!existingProduct) {
      return candidate;
    }

    attempt += 1;
  }
}

async function getUniqueVariantSlug(name: string) {
  const baseSlug = generateSlug(name) || "variacao";
  let attempt = 0;

  while (true) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const existingVariant = await db.query.productVariantTable.findFirst({
      where: eq(productVariantTable.slug, candidate),
    });

    if (!existingVariant) {
      return candidate;
    }

    attempt += 1;
  }
}

export async function createAdminProduct(
  input: AdminProductInput,
): Promise<AdminProductActionResult> {
  const payload = adminProductSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inv\u00e1lidos.",
    };
  }

  await requireAdminSession();

  const productSlug = await getUniqueProductSlug(payload.data.name);
  const variantSlug = await getUniqueVariantSlug(
    `${payload.data.name}-${payload.data.variantColor}`,
  );

  await db.transaction(async (tx) => {
    const [createdProduct] = await tx
      .insert(productTable)
      .values({
        categoryId: payload.data.categoryId,
        name: payload.data.name,
        description: payload.data.description,
        slug: productSlug,
      })
      .returning();

    if (!createdProduct) {
      throw new Error("N\u00e3o foi poss\u00edvel criar o produto.");
    }

    await tx.insert(productVariantTable).values({
      productId: createdProduct.id,
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
    message: "Produto criado com sucesso.",
  };
}
