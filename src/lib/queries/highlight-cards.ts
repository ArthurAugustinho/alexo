"use server";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { highlightCardTable } from "@/db/schema";

export type HighlightCard = typeof highlightCardTable.$inferSelect;

export async function getActiveHighlightCards(): Promise<HighlightCard[]> {
  return db.query.highlightCardTable.findMany({
    where: eq(highlightCardTable.isActive, true),
    orderBy: [asc(highlightCardTable.position)],
  });
}

export async function getAllHighlightCards(): Promise<HighlightCard[]> {
  return db.query.highlightCardTable.findMany({
    orderBy: [asc(highlightCardTable.position)],
  });
}

export async function getHighlightCardById(
  id: string,
): Promise<HighlightCard | undefined> {
  return db.query.highlightCardTable.findFirst({
    where: eq(highlightCardTable.id, id),
  });
}
