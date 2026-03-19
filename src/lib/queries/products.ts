import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { productSizeTable, productTable, productVariantTable } from "@/db/schema";
import {
  productSizeListSchema,
  productSizeTypeSchema,
  productVariantListSchema,
} from "@/lib/product-variant-schema";

export async function getProductBySlug(slug: string) {
  const product = await db.query.productTable.findFirst({
    where: eq(productTable.slug, slug),
    with: {
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

export async function getProductById(productId: string) {
  const product = await db.query.productTable.findFirst({
    where: eq(productTable.id, productId),
    with: {
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
