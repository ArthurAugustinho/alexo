import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  lte,
  sql,
} from "drizzle-orm";

import { db } from "@/db";
import {
  categoryTable,
  productTable,
  productVariantTable,
} from "@/db/schema";
import { normalizeSearch } from "@/helpers/normalize-search";
import {
  compareAlphabeticProductVariantSizes,
  getPreferredVariant,
} from "@/lib/product-variant-schema";

export type SearchParams = {
  q?: string;
  categoryId?: string[];
  brand?: string[];
  colors?: string[];
  sizes?: string[];
  priceMin?: number;
  priceMax?: number;
  page?: number;
  perPage?: number;
};

export type SearchProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: string | null;
  categoryId: string;
  categoryName: string;
  variantSlug: string;
  imageUrl: string;
  priceInCents: number;
};

export type AvailableFilters = {
  categories: Array<{
    id: string;
    name: string;
    count: number;
  }>;
  brands: Array<{
    name: string;
    count: number;
  }>;
  colors: Array<{
    name: string;
    count: number;
  }>;
  sizes: Array<{
    value: string;
    count: number;
  }>;
  priceRange: {
    min: number;
    max: number;
  };
};

export type SearchResult = {
  products: SearchProduct[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  filters: AvailableFilters;
};

type SearchProductWithRelations = typeof productTable.$inferSelect & {
  category: typeof categoryTable.$inferSelect;
  variants: (typeof productVariantTable.$inferSelect)[];
};

function getNormalizedSearchPattern(query?: string) {
  const normalizedQuery = normalizeSearch(query ?? "");

  if (!normalizedQuery) {
    return null;
  }

  return `%${normalizedQuery.split(/\s+/).filter(Boolean).join("%")}%`;
}

function buildSearchClauses(params: SearchParams, options?: { includeQuery?: boolean }) {
  const clauses = [eq(productVariantTable.isAvailable, true)];
  const normalizedPattern = getNormalizedSearchPattern(params.q);

  if (options?.includeQuery !== false && normalizedPattern) {
    clauses.push(
      sql<boolean>`
        unaccent(lower(${productTable.name})) ILIKE unaccent(lower(${normalizedPattern}))
      `,
    );
  }

  if (params.categoryId?.length) {
    clauses.push(inArray(productTable.categoryId, params.categoryId));
  }

  if (params.brand?.length) {
    clauses.push(inArray(productTable.brand, params.brand));
  }

  if (params.colors?.length) {
    clauses.push(inArray(productVariantTable.color, params.colors));
  }

  if (params.sizes?.length) {
    clauses.push(inArray(productVariantTable.size, params.sizes));
  }

  if (typeof params.priceMin === "number") {
    clauses.push(gte(productVariantTable.priceInCents, params.priceMin));
  }

  if (typeof params.priceMax === "number") {
    clauses.push(lte(productVariantTable.priceInCents, params.priceMax));
  }

  return clauses;
}

function normalizeSearchProducts(
  products: SearchProductWithRelations[],
): SearchProduct[] {
  return products.flatMap((product) => {
    const preferredVariant = getPreferredVariant(product.variants);

    if (!preferredVariant) {
      return [];
    }

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      brand: product.brand,
      categoryId: product.categoryId,
      categoryName: product.category.name,
      variantSlug: preferredVariant.slug,
      imageUrl: preferredVariant.imageUrl,
      priceInCents: preferredVariant.priceInCents,
    };
  });
}

function buildAvailableFilters(products: SearchProductWithRelations[]): AvailableFilters {
  const categoryCounts = new Map<string, { id: string; name: string; count: number }>();
  const brandCounts = new Map<string, { name: string; count: number }>();
  const colorCounts = new Map<string, { name: string; count: number }>();
  const sizeCounts = new Map<string, { value: string; count: number }>();
  const prices: number[] = [];

  for (const product of products) {
    if (product.category) {
      const currentCategory = categoryCounts.get(product.category.id) ?? {
        id: product.category.id,
        name: product.category.name,
        count: 0,
      };

      currentCategory.count += 1;
      categoryCounts.set(product.category.id, currentCategory);
    }

    if (product.brand) {
      const currentBrand = brandCounts.get(product.brand) ?? {
        name: product.brand,
        count: 0,
      };

      currentBrand.count += 1;
      brandCounts.set(product.brand, currentBrand);
    }

    const uniqueColors = new Set<string>();
    const uniqueSizes = new Set<string>();

    for (const variant of product.variants) {
      uniqueColors.add(variant.color);
      uniqueSizes.add(variant.size);
      prices.push(variant.priceInCents);
    }

    for (const color of uniqueColors) {
      const currentColor = colorCounts.get(color) ?? {
        name: color,
        count: 0,
      };

      currentColor.count += 1;
      colorCounts.set(color, currentColor);
    }

    for (const size of uniqueSizes) {
      const currentSize = sizeCounts.get(size) ?? {
        value: size,
        count: 0,
      };

      currentSize.count += 1;
      sizeCounts.set(size, currentSize);
    }
  }

  return {
    categories: Array.from(categoryCounts.values()).sort((first, second) =>
      first.name.localeCompare(second.name, "pt-BR", {
        sensitivity: "base",
      }),
    ),
    brands: Array.from(brandCounts.values()).sort((first, second) =>
      first.name.localeCompare(second.name, "pt-BR", {
        sensitivity: "base",
      }),
    ),
    colors: Array.from(colorCounts.values()).sort((first, second) =>
      first.name.localeCompare(second.name, "pt-BR", {
        sensitivity: "base",
      }),
    ),
    sizes: Array.from(sizeCounts.values()).sort((first, second) => {
      const firstIsNumeric = /^\d+$/.test(first.value);
      const secondIsNumeric = /^\d+$/.test(second.value);

      if (firstIsNumeric && secondIsNumeric) {
        return Number(first.value) - Number(second.value);
      }

      if (firstIsNumeric) {
        return 1;
      }

      if (secondIsNumeric) {
        return -1;
      }

      return compareAlphabeticProductVariantSizes(first.value, second.value);
    }),
    priceRange: {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
    },
  };
}

async function ensureUnaccentExtension() {
  try {
    await db.execute(sql.raw("CREATE EXTENSION IF NOT EXISTS unaccent"));
    return true;
  } catch {
    return false;
  }
}

async function getMatchingProductRows(
  params: SearchParams,
  options?: { useSqlQuery?: boolean },
) {
  const rows = await db
    .selectDistinct({
      id: productTable.id,
      name: productTable.name,
      createdAt: productTable.createdAt,
    })
    .from(productTable)
    .innerJoin(categoryTable, eq(categoryTable.id, productTable.categoryId))
    .innerJoin(productVariantTable, eq(productVariantTable.productId, productTable.id))
    .where(
      and(
        ...buildSearchClauses(params, {
          includeQuery: options?.useSqlQuery !== false,
        }),
      ),
    )
    .orderBy(desc(productTable.createdAt));

  if (options?.useSqlQuery === false && params.q) {
    const queryTokens = normalizeSearch(params.q).split(/\s+/).filter(Boolean);

    if (queryTokens.length === 0) {
      return rows;
    }

    return rows.filter((row) => {
      const normalizedName = normalizeSearch(row.name);

      return queryTokens.every((token) => normalizedName.includes(token));
    });
  }

  return rows;
}

export async function searchProducts(params: SearchParams): Promise<SearchResult> {
  const normalizedParams: SearchParams = {
    ...params,
    q: params.q?.trim() ?? "",
    categoryId: params.categoryId?.filter(Boolean) ?? [],
    brand: params.brand?.filter(Boolean) ?? [],
    colors: params.colors?.filter(Boolean) ?? [],
    sizes: params.sizes?.filter(Boolean) ?? [],
    page: params.page && params.page > 0 ? params.page : 1,
    perPage: params.perPage && params.perPage > 0 ? params.perPage : 24,
  };

  const canUseUnaccent = await ensureUnaccentExtension();
  const matchingRows = canUseUnaccent
    ? await getMatchingProductRows(normalizedParams, {
        useSqlQuery: true,
      }).catch(() =>
        getMatchingProductRows(normalizedParams, {
          useSqlQuery: false,
        }),
      )
    : await getMatchingProductRows(normalizedParams, {
        useSqlQuery: false,
      });
  const matchingIds = matchingRows.map((row) => row.id);
  const total = matchingIds.length;
  const totalPages = Math.max(1, Math.ceil(total / (normalizedParams.perPage ?? 24)));
  const page = Math.min(normalizedParams.page ?? 1, totalPages);
  const perPage = normalizedParams.perPage ?? 24;

  if (matchingIds.length === 0) {
    return {
      products: [],
      total: 0,
      page,
      perPage,
      totalPages: 1,
      filters: {
        categories: [],
        brands: [],
        colors: [],
        sizes: [],
        priceRange: {
          min: 0,
          max: 0,
        },
      },
    };
  }

  const allMatchingProducts = await db.query.productTable.findMany({
    where: inArray(productTable.id, matchingIds),
    with: {
      category: true,
      variants: {
        where: eq(productVariantTable.isAvailable, true),
        orderBy: [asc(productVariantTable.createdAt)],
      },
    },
  });

  const offset = (page - 1) * perPage;
  const paginatedIds = matchingIds.slice(offset, offset + perPage);
  const paginatedProducts = await db.query.productTable.findMany({
    where: inArray(productTable.id, paginatedIds),
    with: {
      category: true,
      variants: {
        where: eq(productVariantTable.isAvailable, true),
        orderBy: [asc(productVariantTable.createdAt)],
      },
    },
  });

  const paginatedProductMap = new Map(
    paginatedProducts.map((product) => [product.id, product]),
  );
  const orderedPaginatedProducts = paginatedIds
    .map((productId) => paginatedProductMap.get(productId))
    .filter((product): product is SearchProductWithRelations => Boolean(product));

  return {
    products: normalizeSearchProducts(orderedPaginatedProducts),
    total,
    page,
    perPage,
    totalPages,
    filters: buildAvailableFilters(allMatchingProducts),
  };
}
