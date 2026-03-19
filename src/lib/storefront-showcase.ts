import { and, asc, desc, gte, lte } from "drizzle-orm";

import { db } from "@/db";
import {
  featuredProductTable,
  productTable,
  productVariantTable,
  seasonalBannerTable,
} from "@/db/schema";

import { getPreferredVariant } from "./product-variant-schema";
import {
  type SeasonalBanner,
  seasonalBannerListSchema,
  type StorefrontProduct,
  storefrontProductListSchema,
} from "./storefront-showcase-schema";

type ProductWithVariants = typeof productTable.$inferSelect & {
  variants: (typeof productVariantTable.$inferSelect)[];
};

function normalizeProductsForShowcase(
  products: ProductWithVariants[],
): StorefrontProduct[] {
  const normalizedProducts = products.flatMap((product) => {
    const firstVariant = getPreferredVariant(product.variants);

    if (!firstVariant) {
      return [];
    }

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      variantSlug: firstVariant.slug,
      imageUrl: firstVariant.imageUrl,
      priceInCents: firstVariant.priceInCents,
    };
  });

  return storefrontProductListSchema.parse(normalizedProducts);
}

export async function getActiveSeasonalBanners(
  currentDate = new Date(),
): Promise<SeasonalBanner[]> {
  const banners = await db
    .select({
      id: seasonalBannerTable.id,
      imageUrl: seasonalBannerTable.imageUrl,
      title: seasonalBannerTable.title,
      subtitle: seasonalBannerTable.subtitle,
      linkUrl: seasonalBannerTable.linkUrl,
      startDate: seasonalBannerTable.startDate,
      endDate: seasonalBannerTable.endDate,
    })
    .from(seasonalBannerTable)
    .where(
      and(
        lte(seasonalBannerTable.startDate, currentDate),
        gte(seasonalBannerTable.endDate, currentDate),
      ),
    )
    .orderBy(
      asc(seasonalBannerTable.startDate),
      asc(seasonalBannerTable.createdAt),
    );

  return seasonalBannerListSchema.parse(banners);
}

export async function getNewestStorefrontProducts(): Promise<
  StorefrontProduct[]
> {
  const products = await db.query.productTable.findMany({
    orderBy: [desc(productTable.createdAt)],
    limit: 10,
    with: {
      variants: {
        orderBy: [asc(productVariantTable.createdAt)],
      },
    },
  });

  return normalizeProductsForShowcase(products);
}

export async function getBestSellingStorefrontProducts(): Promise<
  StorefrontProduct[]
> {
  const featuredProducts = await db.query.featuredProductTable.findMany({
    orderBy: [asc(featuredProductTable.position)],
    limit: 10,
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

  if (featuredProducts.length === 0) {
    return [];
  }

  const products = featuredProducts.map((item) => item.product);

  return normalizeProductsForShowcase(products);
}
