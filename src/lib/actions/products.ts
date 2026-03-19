"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  productSizeTable,
  productTable,
  productVariantTable,
} from "@/db/schema";
import { generateVariantSlug } from "@/helpers/generate-slug";
import { isSuperAdminRole, requireAdminSession } from "@/lib/admin-auth";
import {
  type AdminProductInput,
  adminProductSchema,
  type DeleteAdminProductInput,
  deleteAdminProductSchema,
} from "@/lib/admin-product-schema";
import {
  PRODUCT_VARIANT_SIZE_VALUES,
  type ProductSizeType,
} from "@/lib/product-variant-schema";
import { generateSlug } from "@/lib/slug";

type AdminProductActionResult = {
  success: boolean;
  message: string;
};

function getValidationErrorMessage(
  issues: { message: string }[] | undefined,
  fallbackMessage: string,
) {
  return issues?.[0]?.message ?? fallbackMessage;
}

function normalizeProductSizes(productSizes: string[]) {
  return Array.from(
    new Set(productSizes.map((sizeValue) => sizeValue.trim()).filter(Boolean)),
  );
}

function normalizeVariantStocks(
  variantStocks: AdminProductInput["variantStocks"],
) {
  return Array.from(
    new Map(
      variantStocks.map((variantStock) => [
        variantStock.variantId ??
          `${variantStock.color.trim().toLowerCase()}::${variantStock.size.trim()}`,
        {
          variantId: variantStock.variantId,
          color: variantStock.color.trim(),
          size: variantStock.size.trim(),
          stock: variantStock.stock,
          imageUrl: variantStock.imageUrl.trim(),
        },
      ]),
    ).values(),
  );
}

function getDefaultVariantSize(params: {
  sizeType: ProductSizeType;
  productSizes: string[];
  fallbackSize?: string | null;
}) {
  if (params.sizeType === "numeric") {
    return params.productSizes[0] ?? params.fallbackSize ?? "33";
  }

  if (
    params.fallbackSize &&
    PRODUCT_VARIANT_SIZE_VALUES.includes(
      params.fallbackSize as (typeof PRODUCT_VARIANT_SIZE_VALUES)[number],
    )
  ) {
    return params.fallbackSize;
  }

  return "M";
}

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

async function syncProductSizes(params: {
  productId: string;
  productSizes: string[];
  sizeType: ProductSizeType;
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0];
}) {
  await params.tx
    .delete(productSizeTable)
    .where(eq(productSizeTable.productId, params.productId));

  if (params.sizeType !== "numeric" || params.productSizes.length === 0) {
    return;
  }

  await params.tx.insert(productSizeTable).values(
    params.productSizes.map((sizeValue, index) => ({
      productId: params.productId,
      sizeValue,
      position: index,
    })),
  );
}

function revalidateProductPaths(params: { productId: string; productSlug: string }) {
  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/admin/produtos/${params.productId}/variantes`);
  revalidatePath(`/product/${params.productSlug}`);
}

export async function createAdminProduct(
  input: AdminProductInput,
): Promise<AdminProductActionResult> {
  const payload = adminProductSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: getValidationErrorMessage(
        payload.error.issues,
        "Dados invalidos.",
      ),
    };
  }

  await requireAdminSession();

  const normalizedProductSizes = normalizeProductSizes(payload.data.productSizes);
  const productSlug = await getUniqueProductSlug(payload.data.name);
  const variantSlug = await getUniqueVariantSlug(
    `${payload.data.name}-${payload.data.variantColor}`,
  );
  const primaryVariantSize = getDefaultVariantSize({
    sizeType: payload.data.sizeType,
    productSizes: normalizedProductSizes,
  });

  let createdProductId = "";

  await db.transaction(async (tx) => {
    const [createdProduct] = await tx
      .insert(productTable)
      .values({
        categoryId: payload.data.categoryId,
        name: payload.data.name,
        description: payload.data.description,
        slug: productSlug,
        sizeType: payload.data.sizeType,
        shippingCostInCents: Math.round(payload.data.shippingCostInReais * 100),
      })
      .returning();

    if (!createdProduct) {
      throw new Error("Nao foi possivel criar o produto.");
    }

    createdProductId = createdProduct.id;

    await syncProductSizes({
      productId: createdProduct.id,
      productSizes: normalizedProductSizes,
      sizeType: payload.data.sizeType,
      tx,
    });

    await tx.insert(productVariantTable).values({
      productId: createdProduct.id,
      name: payload.data.variantName,
      color: payload.data.variantColor,
      imageUrl: payload.data.imageUrl,
      priceInCents: Math.round(payload.data.priceInReais * 100),
      slug: variantSlug,
      size: primaryVariantSize,
      stock: payload.data.variantStock,
      isAvailable: payload.data.variantStock > 0,
    });
  });

  revalidateProductPaths({
    productId: createdProductId,
    productSlug,
  });

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
      message: getValidationErrorMessage(
        payload.error.issues,
        "Dados invalidos.",
      ),
    };
  }

  if (!payload.data.productId) {
    return {
      success: false,
      message: "Produto invalido.",
    };
  }

  await requireAdminSession();

  const existingProduct = await db.query.productTable.findFirst({
    where: eq(productTable.id, payload.data.productId),
    with: {
      productSizes: {
        orderBy: [asc(productSizeTable.position)],
      },
      variants: {
        orderBy: [asc(productVariantTable.createdAt)],
      },
    },
  });

  if (!existingProduct) {
    return {
      success: false,
      message: "Produto nao encontrado.",
    };
  }

  const primaryVariant =
    existingProduct.variants.find(
      (variant) => variant.id === payload.data.primaryVariantId,
    ) ?? existingProduct.variants[0];

  const normalizedProductSizes = normalizeProductSizes(payload.data.productSizes);
  const normalizedVariantStocks = normalizeVariantStocks(
    payload.data.variantStocks,
  );
  const productSlug =
    existingProduct.name === payload.data.name
      ? existingProduct.slug
      : await getUniqueProductSlug(payload.data.name, existingProduct.id);
  const primaryVariantSize = getDefaultVariantSize({
    sizeType: payload.data.sizeType,
    productSizes: normalizedProductSizes,
    fallbackSize: primaryVariant?.size ?? existingProduct.productSizes[0]?.sizeValue,
  });
  const variantSlug =
    primaryVariant &&
    primaryVariant.color === payload.data.variantColor &&
    primaryVariant.name === payload.data.variantName
      ? primaryVariant.slug
      : await getUniqueVariantSlug(
          `${payload.data.name}-${payload.data.variantColor}`,
          primaryVariant?.id,
        );
  let updatedVariantsCount = 0;
  let createdVariantsCount = 0;

  await db.transaction(async (tx) => {
    await tx
      .update(productTable)
      .set({
        categoryId: payload.data.categoryId,
        name: payload.data.name,
        description: payload.data.description,
        slug: productSlug,
        sizeType: payload.data.sizeType,
        shippingCostInCents: Math.round(payload.data.shippingCostInReais * 100),
      })
      .where(eq(productTable.id, existingProduct.id));

    await syncProductSizes({
      productId: existingProduct.id,
      productSizes: normalizedProductSizes,
      sizeType: payload.data.sizeType,
      tx,
    });

    if (primaryVariant) {
      await tx
        .update(productVariantTable)
        .set({
          name: payload.data.variantName,
          color: payload.data.variantColor,
          imageUrl: payload.data.imageUrl,
          priceInCents: Math.round(payload.data.priceInReais * 100),
          slug: variantSlug,
          size: primaryVariantSize,
          stock: payload.data.variantStock,
          isAvailable: payload.data.variantStock > 0,
        })
        .where(eq(productVariantTable.id, primaryVariant.id));

      updatedVariantsCount += 1;

      for (const variantStock of normalizedVariantStocks) {
        const matchesPrimaryVariant =
          variantStock.variantId === primaryVariant.id ||
          (variantStock.color.trim().toLowerCase() ===
            payload.data.variantColor.trim().toLowerCase() &&
            variantStock.size === primaryVariantSize);

        if (matchesPrimaryVariant) {
          continue;
        }

        if (variantStock.variantId) {
          const matchingVariant = existingProduct.variants.find(
            (variant) => variant.id === variantStock.variantId,
          );

          if (!matchingVariant) {
            continue;
          }

          await tx
            .update(productVariantTable)
            .set({
              stock: variantStock.stock,
              isAvailable: variantStock.stock > 0,
            })
            .where(eq(productVariantTable.id, matchingVariant.id));

          updatedVariantsCount += 1;
          continue;
        }

        const existingVariantByCombination =
          await tx.query.productVariantTable.findFirst({
            where: and(
              eq(productVariantTable.productId, existingProduct.id),
              eq(productVariantTable.color, variantStock.color),
              eq(productVariantTable.size, variantStock.size),
            ),
          });

        if (existingVariantByCombination) {
          await tx
            .update(productVariantTable)
            .set({
              stock: variantStock.stock,
              isAvailable: variantStock.stock > 0,
            })
            .where(eq(productVariantTable.id, existingVariantByCombination.id));

          updatedVariantsCount += 1;
          continue;
        }

        const newVariantSlug = await getUniqueVariantSlug(
          generateVariantSlug(
            productSlug,
            variantStock.color,
            variantStock.size,
          ),
        );

        await tx.insert(productVariantTable).values({
          productId: existingProduct.id,
          name: payload.data.variantName,
          color: variantStock.color,
          imageUrl: variantStock.imageUrl,
          priceInCents: Math.round(payload.data.priceInReais * 100),
          slug: newVariantSlug,
          size: variantStock.size,
          stock: variantStock.stock,
          isAvailable: variantStock.stock > 0,
        });

        createdVariantsCount += 1;
      }

      return;
    }

    await tx.insert(productVariantTable).values({
      productId: existingProduct.id,
      name: payload.data.variantName,
      color: payload.data.variantColor,
      imageUrl: payload.data.imageUrl,
      priceInCents: Math.round(payload.data.priceInReais * 100),
      slug: variantSlug,
      size: primaryVariantSize,
      stock: payload.data.variantStock,
      isAvailable: payload.data.variantStock > 0,
    });

    createdVariantsCount += 1;
  });

  revalidatePath(`/product/${existingProduct.slug}`);
  revalidateProductPaths({
    productId: existingProduct.id,
    productSlug,
  });

  return {
    success: true,
    message: `Produto salvo. ${updatedVariantsCount} variantes atualizadas, ${createdVariantsCount} novas criadas.`,
  };
}

export async function deleteAdminProduct(
  input: DeleteAdminProductInput,
): Promise<AdminProductActionResult> {
  const payload = deleteAdminProductSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: getValidationErrorMessage(
        payload.error.issues,
        "Produto invalido.",
      ),
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
      message: "Produto excluido com sucesso.",
    };
  } catch {
    return {
      success: false,
      message:
        "Este produto nao pode ser excluido porque ja possui pedidos vinculados.",
    };
  }
}
