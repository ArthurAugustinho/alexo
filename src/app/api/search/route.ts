import { asc, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { productTable, productVariantTable } from "@/db/schema";
import { normalizeSearch } from "@/helpers/normalize-search";

const searchQuerySchema = z.object({
  q: z.string().trim().min(2),
});

export const dynamic = "force-dynamic";

function mapSearchResults(
  products: Array<{
    id: string;
    name: string;
    slug: string;
    variants: Array<{ imageUrl: string }>;
  }>,
) {
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    imageUrl: product.variants[0]?.imageUrl ?? "",
  }));
}

export async function GET(request: NextRequest) {
  const normalizedQuery = normalizeSearch(
    request.nextUrl.searchParams.get("q") ?? "",
  );
  const parsedQuery = searchQuerySchema.safeParse({
    q: normalizedQuery,
  });

  if (!parsedQuery.success) {
    return NextResponse.json([]);
  }

  const normalizedPattern = `%${parsedQuery.data.q
    .split(/\s+/)
    .filter(Boolean)
    .join("%")}%`;

  // Habilite a extensao uma vez no PostgreSQL para busca sem acentos:
  // CREATE EXTENSION IF NOT EXISTS unaccent;
  try {
    await db.execute(sql.raw("CREATE EXTENSION IF NOT EXISTS unaccent"));
  } catch {
    // Opcao B sem `unaccent` no banco:
    // where: sql<boolean>`lower(${productTable.name}) ILIKE lower(${normalizedPattern})`
    // Como esse fallback nao cobre acentos, usamos a alternativa em memoria abaixo
    // caso a query com `unaccent` nao esteja disponivel.
  }

  try {
    const products = await db.query.productTable.findMany({
      columns: {
        id: true,
        name: true,
        slug: true,
      },
      where: sql<boolean>`
        unaccent(lower(${productTable.name})) ILIKE unaccent(lower(${normalizedPattern}))
      `,
      orderBy: [asc(productTable.name)],
      limit: 6,
      with: {
        variants: {
          columns: {
            imageUrl: true,
          },
          orderBy: [asc(productVariantTable.createdAt)],
          limit: 1,
        },
      },
    });

    return NextResponse.json(mapSearchResults(products));
  } catch {
    const fallbackProducts = await db.query.productTable.findMany({
      columns: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: [asc(productTable.name)],
      limit: 24,
      with: {
        variants: {
          columns: {
            imageUrl: true,
          },
          orderBy: [asc(productVariantTable.createdAt)],
          limit: 1,
        },
      },
    });

    const searchTokens = parsedQuery.data.q.split(/\s+/).filter(Boolean);
    const filteredProducts = fallbackProducts
      .filter((product) => {
        const normalizedProductName = normalizeSearch(product.name);

        return searchTokens.every((token) =>
          normalizedProductName.includes(token),
        );
      })
      .slice(0, 6);

    return NextResponse.json(mapSearchResults(filteredProducts));
  }
}
