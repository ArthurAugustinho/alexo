import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { categoryTable, sizeChartTable } from "@/db/schema";
import {
  type SizeChartEntry,
  sizeChartEntryListSchema,
  sizeChartEntrySchema,
} from "@/lib/size-chart-schema";

export type SizeChartByCategoryResult = {
  category: {
    id: string;
    name: string;
    slug: string;
  };
  entries: SizeChartEntry[];
};

export async function getSizeChartByCategory(
  categoryId: string,
): Promise<SizeChartByCategoryResult | null> {
  const category = await db.query.categoryTable.findFirst({
    where: eq(categoryTable.id, categoryId),
    with: {
      sizeCharts: {
        orderBy: [asc(sizeChartTable.position), asc(sizeChartTable.createdAt)],
      },
    },
  });

  if (!category) {
    return null;
  }

  return {
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
    },
    entries: sizeChartEntryListSchema.parse(category.sizeCharts),
  };
}

export async function getSizeChartById(entryId: string) {
  const entry = await db.query.sizeChartTable.findFirst({
    where: eq(sizeChartTable.id, entryId),
    with: {
      category: true,
    },
  });

  if (!entry) {
    return null;
  }

  return sizeChartEntrySchema.parse(entry);
}
