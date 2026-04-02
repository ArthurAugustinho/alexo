import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { simpleBannerTable } from "@/db/schema";

export type SimpleBanner = typeof simpleBannerTable.$inferSelect;

export async function getActiveSimpleBanner(): Promise<SimpleBanner | null> {
  const banner = await db.query.simpleBannerTable.findFirst({
    where: eq(simpleBannerTable.isActive, true),
    orderBy: [desc(simpleBannerTable.createdAt)],
  });

  return banner ?? null;
}

export async function getAllSimpleBanners(): Promise<SimpleBanner[]> {
  return db.query.simpleBannerTable.findMany({
    orderBy: [desc(simpleBannerTable.createdAt)],
  });
}
