import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { tripleImageGridItemTable } from "@/db/schema";

export type TripleImageGridItem = typeof tripleImageGridItemTable.$inferSelect;

export async function getActiveTripleImageGrid(): Promise<TripleImageGridItem[]> {
  return db.query.tripleImageGridItemTable.findMany({
    where: eq(tripleImageGridItemTable.isActive, true),
    orderBy: [asc(tripleImageGridItemTable.position)],
  });
}

export async function getAllTripleImageGridItems(): Promise<TripleImageGridItem[]> {
  return db.query.tripleImageGridItemTable.findMany({
    orderBy: [asc(tripleImageGridItemTable.position)],
  });
}
