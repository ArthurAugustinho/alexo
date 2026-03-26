"use server";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { trustBadgeTable } from "@/db/schema";

export type TrustBadge = typeof trustBadgeTable.$inferSelect;

export async function getActiveTrustBadges(): Promise<TrustBadge[]> {
  return db.query.trustBadgeTable.findMany({
    where: eq(trustBadgeTable.isActive, true),
    orderBy: [asc(trustBadgeTable.position)],
  });
}

export async function getAllTrustBadges(): Promise<TrustBadge[]> {
  return db.query.trustBadgeTable.findMany({
    orderBy: [asc(trustBadgeTable.position)],
  });
}

export async function getTrustBadgeById(
  id: string,
): Promise<TrustBadge | undefined> {
  return db.query.trustBadgeTable.findFirst({
    where: eq(trustBadgeTable.id, id),
  });
}
