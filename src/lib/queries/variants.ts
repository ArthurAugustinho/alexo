import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { productTable, productVariantTable } from "@/db/schema";
import {
  compareProductVariantSizes,
  productVariantListSchema,
  type ProductVariantModel,
} from "@/lib/product-variant-schema";

export type AdminVariantListItem = ProductVariantModel;

export type ProductVariantsByProductId = {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
  };
  variants: AdminVariantListItem[];
};

export async function getVariantsByProductId(
  productId: string,
): Promise<ProductVariantsByProductId | null> {
  const product = await db.query.productTable.findFirst({
    where: eq(productTable.id, productId),
    with: {
      variants: {
        orderBy: [asc(productVariantTable.color), asc(productVariantTable.createdAt)],
      },
    },
  });

  if (!product) {
    return null;
  }

  const variants = [...productVariantListSchema.parse(product.variants)].sort(
    (leftVariant, rightVariant) => {
      const colorComparison = leftVariant.color.localeCompare(
        rightVariant.color,
        "pt-BR",
        { sensitivity: "base" },
      );

      if (colorComparison !== 0) {
        return colorComparison;
      }

      const sizeComparison = compareProductVariantSizes(
        leftVariant.size,
        rightVariant.size,
      );

      if (sizeComparison !== 0) {
        return sizeComparison;
      }

      return leftVariant.createdAt.getTime() - rightVariant.createdAt.getTime();
    },
  );

  return {
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
    },
    variants,
  };
}
