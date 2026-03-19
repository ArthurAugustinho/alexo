import { asc, desc, ilike } from "drizzle-orm";

import { db } from "@/db";
import {
  featuredProductTable,
  productTable,
  productVariantTable,
  seasonalBannerTable,
} from "@/db/schema";
import {
  type AdminBannerListItem,
  adminBannerListSchema,
  type FeaturedProductListItem,
  featuredProductListSchema,
  type FeaturedProductSearchItem,
  featuredProductSearchSchema,
} from "@/lib/admin-showcase-schema";
import { getPreferredVariant } from "@/lib/product-variant-schema";

type ProductWithVariants = typeof productTable.$inferSelect & {
  variants: (typeof productVariantTable.$inferSelect)[];
};

export function getBannerDisplayStatus(
  banner: Pick<AdminBannerListItem, "startDate" | "endDate">,
  currentDate = new Date(),
) {
  if (banner.startDate > currentDate) {
    return "agendado" as const;
  }

  if (banner.endDate < currentDate) {
    return "expirado" as const;
  }

  return "vigente" as const;
}

function normalizeProducts(
  products: ProductWithVariants[],
): FeaturedProductSearchItem[] {
  return products.flatMap((product) => {
    const firstVariant = getPreferredVariant(product.variants);

    if (!firstVariant) {
      return [];
    }

    return {
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      imageUrl: firstVariant.imageUrl,
      priceInCents: firstVariant.priceInCents,
      variantSlug: firstVariant.slug,
      alreadyFeatured: false,
    };
  });
}

export async function getAdminBanners(): Promise<AdminBannerListItem[]> {
  const banners = await db.query.seasonalBannerTable.findMany({
    orderBy: [desc(seasonalBannerTable.startDate)],
  });

  return adminBannerListSchema.parse(banners);
}

export async function getAdminFeaturedProducts(): Promise<
  FeaturedProductListItem[]
> {
  const featuredItems = await db.query.featuredProductTable.findMany({
    orderBy: [asc(featuredProductTable.position)],
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

  const normalizedItems = featuredItems.flatMap((item) => {
    const firstVariant = getPreferredVariant(item.product.variants);

    if (!firstVariant) {
      return [];
    }

    return {
      id: item.id,
      position: item.position,
      productId: item.product.id,
      productName: item.product.name,
      productSlug: item.product.slug,
      imageUrl: firstVariant.imageUrl,
      priceInCents: firstVariant.priceInCents,
      variantSlug: firstVariant.slug,
    };
  });

  return featuredProductListSchema.parse(normalizedItems);
}

export async function searchAdminProductsForFeatured(
  searchTerm: string,
): Promise<FeaturedProductSearchItem[]> {
  const normalizedSearchTerm = searchTerm.trim();
  const featuredItems = await db.query.featuredProductTable.findMany({
    orderBy: [asc(featuredProductTable.position)],
  });
  const featuredProductIds = new Set(featuredItems.map((item) => item.productId));

  const products = normalizedSearchTerm
    ? await db.query.productTable.findMany({
        where: ilike(productTable.name, `%${normalizedSearchTerm}%`),
        orderBy: [asc(productTable.name)],
        limit: 20,
        with: {
          variants: {
            orderBy: [asc(productVariantTable.createdAt)],
          },
        },
      })
    : await db.query.productTable.findMany({
        orderBy: [asc(productTable.name)],
        limit: 12,
        with: {
          variants: {
            orderBy: [asc(productVariantTable.createdAt)],
          },
        },
      });

  const normalizedProducts = normalizeProducts(products).map((product) => ({
    ...product,
    alreadyFeatured: featuredProductIds.has(product.productId),
  }));

  return featuredProductSearchSchema.parse(normalizedProducts);
}
