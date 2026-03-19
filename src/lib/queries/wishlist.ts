import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { productVariantTable, wishlistItemTable } from "@/db/schema";
import { getPreferredVariant } from "@/lib/product-variant-schema";

export type WishlistItem = {
  id: string;
  createdAt: Date;
  productId: string;
  productName: string;
  productSlug: string;
  productBrand: string | null;
  imageUrl: string | null;
  priceInCents: number;
  productUrl: string;
  preferredVariantId: string | null;
  hasAvailableVariant: boolean;
};

export async function getWishlistByUserId(
  userId: string,
): Promise<WishlistItem[]> {
  const wishlistItems = await db.query.wishlistItemTable.findMany({
    where: eq(wishlistItemTable.userId, userId),
    orderBy: [desc(wishlistItemTable.createdAt)],
    with: {
      product: {
        with: {
          variants: {
            orderBy: [asc(productVariantTable.createdAt)],
          },
        },
      },
    },
  });

  return wishlistItems.flatMap((wishlistItem) => {
    const firstVariant = wishlistItem.product.variants[0] ?? null;
    const preferredVariant = getPreferredVariant(wishlistItem.product.variants);
    const hasAvailableVariant = wishlistItem.product.variants.some(
      (variant) => variant.isAvailable,
    );
    const imageUrl = firstVariant?.imageUrl ?? preferredVariant?.imageUrl ?? null;
    const priceInCents =
      preferredVariant?.priceInCents ?? firstVariant?.priceInCents ?? 0;
    const productUrl = preferredVariant
      ? `/product/${wishlistItem.product.slug}?variant=${preferredVariant.slug}`
      : `/product/${wishlistItem.product.slug}`;

    return [
      {
        id: wishlistItem.id,
        createdAt: wishlistItem.createdAt,
        productId: wishlistItem.productId,
        productName: wishlistItem.product.name,
        productSlug: wishlistItem.product.slug,
        productBrand: wishlistItem.product.brand,
        imageUrl,
        priceInCents,
        productUrl,
        preferredVariantId: hasAvailableVariant ? preferredVariant?.id ?? null : null,
        hasAvailableVariant,
      },
    ];
  });
}

export async function getWishlistProductIds(userId: string): Promise<string[]> {
  const wishlistItems = await db
    .select({
      productId: wishlistItemTable.productId,
    })
    .from(wishlistItemTable)
    .where(eq(wishlistItemTable.userId, userId))
    .orderBy(desc(wishlistItemTable.createdAt));

  return wishlistItems.map((wishlistItem) => wishlistItem.productId);
}

export async function isProductInWishlist(
  userId: string,
  productId: string,
): Promise<boolean> {
  const wishlistItem = await db.query.wishlistItemTable.findFirst({
    where: and(
      eq(wishlistItemTable.userId, userId),
      eq(wishlistItemTable.productId, productId),
    ),
  });

  return Boolean(wishlistItem);
}
