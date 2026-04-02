import { and, asc, eq, gt, ilike, ne, sql } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";

import { db } from "@/db";
import { categoryTable, productSizeTable, productTable, productVariantTable } from "@/db/schema";
import { getPreferredVariant } from "@/lib/product-variant-schema";
import {
  productSizeListSchema,
  productSizeTypeSchema,
  productVariantListSchema,
} from "@/lib/product-variant-schema";

export type CarouselProduct = {
  id: string;
  name: string;
  slug: string;
  variantSlug: string;
  imageUrl: string;
  priceInCents: number;
  originalPriceInCents: number | null;
  discountPercent: number | null;
  badgeLabel: string | null;
};

type ProductWithVariantsRaw = typeof productTable.$inferSelect & {
  variants: (typeof productVariantTable.$inferSelect)[];
};

function normalizeForCarousel(products: ProductWithVariantsRaw[]): CarouselProduct[] {
  return products.flatMap((product) => {
    const variant = getPreferredVariant(product.variants);
    if (!variant) return [];
    return [
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        variantSlug: variant.slug,
        imageUrl: variant.imageUrl,
        priceInCents: variant.priceInCents,
        originalPriceInCents: product.originalPriceInCents ?? null,
        discountPercent: product.discountPercent ?? null,
        badgeLabel: product.badgeLabel ?? null,
      },
    ];
  });
}

export async function getProductBySlug(slug: string) {
  const product = await db.query.productTable.findFirst({
    where: eq(productTable.slug, slug),
    with: {
      category: true,
      productSizes: {
        orderBy: [asc(productSizeTable.position)],
      },
      variants: true,
    },
  });

  if (!product) {
    return null;
  }

  return {
    ...product,
    productSizes: productSizeListSchema.parse(product.productSizes),
    sizeType: productSizeTypeSchema.parse(product.sizeType),
    variants: productVariantListSchema.parse(product.variants),
  };
}

export async function getRecommendedProducts(
  categoryId: string,
  excludeId: string,
): Promise<CarouselProduct[]> {
  noStore();

  const products = await db.query.productTable.findMany({
    where: and(
      eq(productTable.categoryId, categoryId),
      ne(productTable.id, excludeId),
    ),
    with: { variants: true },
    orderBy: sql`RANDOM()`,
    limit: 8,
  });

  return normalizeForCarousel(products);
}

export async function getFrequentlyBoughtProducts(
  excludeId: string,
): Promise<CarouselProduct[]> {
  noStore();

  const accessoriesCategory = await db.query.categoryTable.findFirst({
    where: ilike(categoryTable.name, "%acess%"),
    columns: { id: true },
  });

  if (!accessoriesCategory) return [];

  const products = await db.query.productTable.findMany({
    where: and(
      eq(productTable.categoryId, accessoriesCategory.id),
      ne(productTable.id, excludeId),
    ),
    with: { variants: true },
    orderBy: sql`RANDOM()`,
    limit: 8,
  });

  return normalizeForCarousel(products);
}

export async function getSaleProducts(
  excludeId: string,
): Promise<CarouselProduct[]> {
  noStore();

  const products = await db.query.productTable.findMany({
    where: and(
      eq(productTable.isOnSale, true),
      ne(productTable.id, excludeId),
      gt(productTable.discountPercent, 0),
    ),
    with: { variants: true },
    orderBy: [sql`${productTable.discountPercent} DESC NULLS LAST`, sql`RANDOM()`],
    limit: 8,
  });

  return normalizeForCarousel(products);
}

export async function getOnSaleProducts(): Promise<CarouselProduct[]> {
  const products = await db.query.productTable.findMany({
    where: eq(productTable.isOnSale, true),
    with: { variants: true },
    orderBy: [sql`${productTable.discountPercent} DESC NULLS LAST`],
    limit: 12,
  });

  return normalizeForCarousel(products);
}

export async function getProductById(productId: string) {
  const product = await db.query.productTable.findFirst({
    where: eq(productTable.id, productId),
    with: {
      category: true,
      productSizes: {
        orderBy: [asc(productSizeTable.position)],
      },
      variants: {
        orderBy: [asc(productVariantTable.createdAt)],
      },
    },
  });

  if (!product) {
    return null;
  }

  return {
    ...product,
    productSizes: productSizeListSchema.parse(product.productSizes),
    sizeType: productSizeTypeSchema.parse(product.sizeType),
    variants: productVariantListSchema.parse(product.variants),
  };
}
