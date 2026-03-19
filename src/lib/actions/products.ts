"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { productTable, productVariantTable } from "@/db/schema";
import { isSuperAdminRole, requireAdminSession } from "@/lib/admin-auth";
import {
  type AdminProductInput,
  adminProductSchema,
  type DeleteAdminProductInput,
  deleteAdminProductSchema,
} from "@/lib/admin-product-schema";
import { generateSlug } from "@/lib/slug";

type AdminProductActionResult = {
  success: boolean;
  message: string;
};

type DeleteAdminProductResult = {
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
        shippingCostInCents: Math.round(payload.data.shippingCostInReais * 100),
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

export async function deleteAdminProduct(
  input: DeleteAdminProductInput,
): Promise<DeleteAdminProductResult> {
  const payload = deleteAdminProductSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Produto inv\u00e1lido.",
    };
  }

  const { role } = await requireAdminSession();

  if (!isSuperAdminRole(role)) {
    return {
      success: false,
      message: "Apenas o super admin pode excluir produtos.",
    };
  }

  try {
    await db
      .delete(productTable)
      .where(eq(productTable.id, payload.data.productId));

    revalidatePath("/");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: "Produto exclu\u00eddo com sucesso.",
    };
  } catch {
    return {
      success: false,
      message:
        "Este produto n\u00e3o pode ser exclu\u00eddo porque j\u00e1 possui pedidos vinculados.",
    };
  }
}
