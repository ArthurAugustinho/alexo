"use server";

import { asc, eq } from "drizzle-orm";
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
import { type ProductSizeType } from "@/lib/product-variant-schema";
import { generateSlug } from "@/lib/slug";

type AdminProductActionResult = {
  success: boolean;
  message: string;
  productId?: string;
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

async function getUniqueVariantSlug(
  name: string,
  excludeVariantId?: string,
  excludeSlugs?: Set<string>,
) {
  const baseSlug = generateSlug(name) || "variacao";
  let attempt = 0;

  while (true) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;

    if (!excludeSlugs?.has(candidate)) {
      const existingVariant = await db.query.productVariantTable.findFirst({
        where: eq(productVariantTable.slug, candidate),
      });

      if (!existingVariant || existingVariant.id === excludeVariantId) {
        return candidate;
      }
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

  let createdProductId = "";

  const basePriceInCents = Math.round(payload.data.priceInReais * 100);
  const discountPercent = payload.data.discountPercent ?? null;
  const originalPriceInCents = discountPercent ? basePriceInCents : null;
  const finalPriceInCents = discountPercent
    ? Math.round(basePriceInCents * (1 - discountPercent / 100))
    : basePriceInCents;
  const isOnSale = Boolean(discountPercent);

  // Pre-compute slugs for all variants before opening the transaction
  const usedVariantSlugs = new Set<string>();
  const variantEntries: Array<{
    cor: string;
    tamanho: string;
    estoque: number;
    imageUrl: string | undefined;
    slug: string;
  }> = [];

  for (const variante of payload.data.variantes) {
    const slug = await getUniqueVariantSlug(
      generateVariantSlug(productSlug, variante.cor, variante.tamanho),
      undefined,
      usedVariantSlugs,
    );
    usedVariantSlugs.add(slug);
    variantEntries.push({
      cor: variante.cor,
      tamanho: variante.tamanho,
      estoque: variante.estoque,
      imageUrl: variante.imageUrl,
      slug,
    });
  }

  await db.transaction(async (tx) => {
    const [createdProduct] = await tx
      .insert(productTable)
      .values({
        categoryId: payload.data.categoryId,
        name: payload.data.name,
        brand: payload.data.brand || null,
        videoUrl: payload.data.videoUrl || null,
        isVerified: payload.data.isVerified,
        originPostalCode: payload.data.originPostalCode ?? null,
        description: payload.data.description,
        slug: productSlug,
        sizeType: payload.data.sizeType,
        shippingCostInCents: Math.round(payload.data.shippingCostInReais * 100),
        weightGrams: payload.data.weightGrams ?? null,
        widthCm: payload.data.widthCm ?? null,
        heightCm: payload.data.heightCm ?? null,
        lengthCm: payload.data.lengthCm ?? null,
        deliveryDaysMin: payload.data.deliveryDaysMin ?? null,
        deliveryDaysMax: payload.data.deliveryDaysMax ?? null,
        discountPercent,
        originalPriceInCents,
        isOnSale,
        badgeLabel: payload.data.badgeLabel || null,
        pixDiscountText: payload.data.pixDiscountText || null,
        isCustomizable: payload.data.isCustomizable,
        customizationLeadDays: payload.data.customizationLeadDays,
        nameFieldEnabled: payload.data.nameFieldEnabled,
        nameFieldPriceInCents: Math.round(
          (payload.data.nameFieldPriceInReais ?? 0) * 100,
        ),
        numberFieldEnabled: payload.data.numberFieldEnabled,
        numberFieldPriceInCents: Math.round(
          (payload.data.numberFieldPriceInReais ?? 0) * 100,
        ),
        patchOptions: payload.data.patches?.length
          ? payload.data.patches.map((p) => ({
              id: p.id,
              label: p.label,
              imageUrl: p.imageUrl,
              priceInCents: p.priceInCents,
            }))
          : null,
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

    const primaryImageUrl = payload.data.images[0]?.url ?? "";

    await tx.insert(productVariantTable).values(
      variantEntries.map((v) => ({
        productId: createdProduct.id,
        name: v.cor,
        color: v.cor,
        size: v.tamanho,
        imageUrl: v.imageUrl || primaryImageUrl,
        priceInCents: finalPriceInCents,
        slug: v.slug,
        stock: v.estoque,
        isAvailable: v.estoque > 0,
      })),
    );
  });

  revalidateProductPaths({
    productId: createdProductId,
    productSlug,
  });

  const variantCount = variantEntries.length;

  return {
    success: true,
    message: `Produto criado com sucesso com ${variantCount} variante${variantCount !== 1 ? "s" : ""}.`,
    productId: createdProductId,
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

  const normalizedProductSizes = normalizeProductSizes(payload.data.productSizes);
  const productSlug =
    existingProduct.name === payload.data.name
      ? existingProduct.slug
      : await getUniqueProductSlug(payload.data.name, existingProduct.id);
  const updateBasePriceInCents = Math.round(payload.data.priceInReais * 100);
  const updateDiscountPercent = payload.data.discountPercent ?? null;
  const updateOriginalPriceInCents = updateDiscountPercent
    ? updateBasePriceInCents
    : null;
  const updateFinalPriceInCents = updateDiscountPercent
    ? Math.round(updateBasePriceInCents * (1 - updateDiscountPercent / 100))
    : updateBasePriceInCents;
  const updateIsOnSale = Boolean(updateDiscountPercent);

  // Build variant ops (update existing / insert new) before opening the transaction
  const existingVariantById = new Map(
    existingProduct.variants.map((v) => [v.id, v]),
  );
  // Track all existing slugs so inserts don't collide
  const usedVariantSlugs = new Set<string>(
    existingProduct.variants.map((v) => v.slug),
  );

  type VariantUpdateOp = {
    type: "update";
    variantId: string;
    cor: string;
    tamanho: string;
    estoque: number;
    imageUrl: string;
  };
  type VariantInsertOp = {
    type: "insert";
    cor: string;
    tamanho: string;
    estoque: number;
    imageUrl: string;
    slug: string;
  };

  const variantOps: Array<VariantUpdateOp | VariantInsertOp> = [];
  const primaryImageUrl = payload.data.images[0]?.url ?? "";

  for (const variante of payload.data.variantes) {
    const existing = variante.id
      ? existingVariantById.get(variante.id)
      : undefined;

    if (existing) {
      variantOps.push({
        type: "update",
        variantId: existing.id,
        cor: variante.cor,
        tamanho: variante.tamanho,
        estoque: variante.estoque,
        imageUrl: variante.imageUrl || existing.imageUrl,
      });
      continue;
    }

    const slug = await getUniqueVariantSlug(
      generateVariantSlug(productSlug, variante.cor, variante.tamanho),
      undefined,
      usedVariantSlugs,
    );
    usedVariantSlugs.add(slug);

    variantOps.push({
      type: "insert",
      cor: variante.cor,
      tamanho: variante.tamanho,
      estoque: variante.estoque,
      imageUrl: variante.imageUrl || primaryImageUrl,
      slug,
    });
  }

  let updatedVariantsCount = 0;
  let createdVariantsCount = 0;

  await db.transaction(async (tx) => {
    await tx
      .update(productTable)
      .set({
        categoryId: payload.data.categoryId,
        name: payload.data.name,
        brand: payload.data.brand || null,
        videoUrl: payload.data.videoUrl || null,
        isVerified: payload.data.isVerified,
        originPostalCode: payload.data.originPostalCode ?? null,
        description: payload.data.description,
        slug: productSlug,
        sizeType: payload.data.sizeType,
        shippingCostInCents: Math.round(payload.data.shippingCostInReais * 100),
        weightGrams: payload.data.weightGrams ?? null,
        widthCm: payload.data.widthCm ?? null,
        heightCm: payload.data.heightCm ?? null,
        lengthCm: payload.data.lengthCm ?? null,
        deliveryDaysMin: payload.data.deliveryDaysMin ?? null,
        deliveryDaysMax: payload.data.deliveryDaysMax ?? null,
        discountPercent: updateDiscountPercent,
        originalPriceInCents: updateOriginalPriceInCents,
        isOnSale: updateIsOnSale,
        badgeLabel: payload.data.badgeLabel || null,
        pixDiscountText: payload.data.pixDiscountText || null,
        isCustomizable: payload.data.isCustomizable,
        customizationLeadDays: payload.data.customizationLeadDays,
        nameFieldEnabled: payload.data.nameFieldEnabled,
        nameFieldPriceInCents: Math.round(
          (payload.data.nameFieldPriceInReais ?? 0) * 100,
        ),
        numberFieldEnabled: payload.data.numberFieldEnabled,
        numberFieldPriceInCents: Math.round(
          (payload.data.numberFieldPriceInReais ?? 0) * 100,
        ),
        patchOptions: payload.data.patches?.length
          ? payload.data.patches.map((p) => ({
              id: p.id,
              label: p.label,
              imageUrl: p.imageUrl,
              priceInCents: p.priceInCents,
            }))
          : null,
      })
      .where(eq(productTable.id, existingProduct.id));

    await syncProductSizes({
      productId: existingProduct.id,
      productSizes: normalizedProductSizes,
      sizeType: payload.data.sizeType,
      tx,
    });

    for (const op of variantOps) {
      if (op.type === "update") {
        await tx
          .update(productVariantTable)
          .set({
            name: op.cor,
            color: op.cor,
            size: op.tamanho,
            stock: op.estoque,
            imageUrl: op.imageUrl,
            priceInCents: updateFinalPriceInCents,
            isAvailable: op.estoque > 0,
          })
          .where(eq(productVariantTable.id, op.variantId));

        updatedVariantsCount += 1;
      } else {
        await tx.insert(productVariantTable).values({
          productId: existingProduct.id,
          name: op.cor,
          color: op.cor,
          size: op.tamanho,
          stock: op.estoque,
          imageUrl: op.imageUrl,
          priceInCents: updateFinalPriceInCents,
          slug: op.slug,
          isAvailable: op.estoque > 0,
        });

        createdVariantsCount += 1;
      }
    }
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
