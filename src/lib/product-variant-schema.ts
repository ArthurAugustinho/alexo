import { z } from "zod";

export const PRODUCT_VARIANT_SIZE_VALUES = [
  "PP",
  "P",
  "M",
  "G",
  "GG",
  "GGG",
] as const;

const productVariantSizeRankMap = new Map(
  PRODUCT_VARIANT_SIZE_VALUES.map((size, index) => [size, index]),
);

export const productVariantSizeSchema = z.enum(PRODUCT_VARIANT_SIZE_VALUES);

export const productVariantSchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  size: productVariantSizeSchema,
  color: z.string().trim().min(1),
  priceInCents: z.number().int().nonnegative(),
  imageUrl: z.url(),
  isAvailable: z.boolean(),
  createdAt: z.date(),
});

export const productVariantListSchema = z.array(productVariantSchema);

export type ProductVariantModel = z.infer<typeof productVariantSchema>;
export type ProductVariantSize = z.infer<typeof productVariantSizeSchema>;

export function compareProductVariantSizes(
  firstSize: ProductVariantSize,
  secondSize: ProductVariantSize,
) {
  return (
    (productVariantSizeRankMap.get(firstSize) ?? 0) -
    (productVariantSizeRankMap.get(secondSize) ?? 0)
  );
}

export function getPreferredVariant<TVariant extends { isAvailable: boolean }>(
  variants: TVariant[],
) {
  return variants.find((variant) => variant.isAvailable) ?? variants[0] ?? null;
}
