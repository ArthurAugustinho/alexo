import { z } from "zod";

export const PRODUCT_VARIANT_SIZE_VALUES = [
  "PP",
  "P",
  "M",
  "G",
  "GG",
  "GGG",
] as const;

export const PRODUCT_SIZE_TYPE_VALUES = ["alphabetic", "numeric"] as const;
export const NUMERIC_PRODUCT_SIZE_VALUES = Array.from(
  { length: 16 },
  (_, index) => String(index + 33),
) as string[];

const productVariantSizeRankMap = new Map(
  PRODUCT_VARIANT_SIZE_VALUES.map((size, index) => [size, index]),
);

export const alphabeticProductVariantSizeSchema = z.enum(
  PRODUCT_VARIANT_SIZE_VALUES,
);
export const productSizeTypeSchema = z.enum(PRODUCT_SIZE_TYPE_VALUES);
export const productVariantSizeSchema = z.string().trim().min(1).max(10);

export const productSizeSchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  sizeValue: productVariantSizeSchema,
  position: z.number().int().nonnegative(),
  createdAt: z.date(),
});

export const productVariantSchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  size: productVariantSizeSchema,
  color: z.string().trim().min(1),
  priceInCents: z.number().int().nonnegative(),
  imageUrl: z.url(),
  stock: z.number().int().nonnegative(),
  isAvailable: z.boolean(),
  createdAt: z.date(),
});

export const productSizeListSchema = z.array(productSizeSchema);
export const productVariantListSchema = z.array(productVariantSchema);

export type ProductSizeType = z.infer<typeof productSizeTypeSchema>;
export type ProductSizeModel = z.infer<typeof productSizeSchema>;
export type ProductVariantModel = z.infer<typeof productVariantSchema>;
export type ProductVariantSize = z.infer<typeof productVariantSizeSchema>;

export function compareAlphabeticProductVariantSizes(
  firstSize: string,
  secondSize: string,
) {
  const firstRank = productVariantSizeRankMap.get(
    firstSize as (typeof PRODUCT_VARIANT_SIZE_VALUES)[number],
  );
  const secondRank = productVariantSizeRankMap.get(
    secondSize as (typeof PRODUCT_VARIANT_SIZE_VALUES)[number],
  );

  if (typeof firstRank === "number" && typeof secondRank === "number") {
    return firstRank - secondRank;
  }

  if (typeof firstRank === "number") {
    return -1;
  }

  if (typeof secondRank === "number") {
    return 1;
  }

  return firstSize.localeCompare(secondSize, "pt-BR", {
    numeric: true,
    sensitivity: "base",
  });
}

export function compareProductSizeValues(params: {
  firstSize: string;
  secondSize: string;
  sizeType: ProductSizeType;
  productSizes?: Pick<ProductSizeModel, "position" | "sizeValue">[];
}) {
  if (params.sizeType === "numeric") {
    const positionMap = new Map(
      (params.productSizes ?? []).map((size) => [size.sizeValue, size.position]),
    );
    const firstPosition = positionMap.get(params.firstSize);
    const secondPosition = positionMap.get(params.secondSize);

    if (
      typeof firstPosition === "number" &&
      typeof secondPosition === "number"
    ) {
      return firstPosition - secondPosition;
    }

    if (typeof firstPosition === "number") {
      return -1;
    }

    if (typeof secondPosition === "number") {
      return 1;
    }

    return params.firstSize.localeCompare(params.secondSize, "pt-BR", {
      numeric: true,
      sensitivity: "base",
    });
  }

  return compareAlphabeticProductVariantSizes(
    params.firstSize,
    params.secondSize,
  );
}

export function getPreferredVariant<TVariant extends { isAvailable: boolean }>(
  variants: TVariant[],
) {
  return variants.find((variant) => variant.isAvailable) ?? variants[0] ?? null;
}
