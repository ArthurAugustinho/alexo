import { asc, ilike } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { productTable, productVariantTable } from "@/db/schema";

const searchQuerySchema = z.object({
  q: z.string().trim().min(2),
});

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const parsedQuery = searchQuerySchema.safeParse({
    q: request.nextUrl.searchParams.get("q") ?? "",
  });

  if (!parsedQuery.success) {
    return NextResponse.json([]);
  }

  const products = await db.query.productTable.findMany({
    columns: {
      id: true,
      name: true,
      slug: true,
    },
    where: ilike(productTable.name, `%${parsedQuery.data.q}%`),
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

  return NextResponse.json(
    products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      imageUrl: product.variants[0]?.imageUrl ?? "",
    })),
  );
}
