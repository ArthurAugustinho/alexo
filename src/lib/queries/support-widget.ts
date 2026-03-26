"use server";

import { db } from "@/db";
import { supportWidgetConfigTable } from "@/db/schema";

export type SupportWidgetConfig =
  typeof supportWidgetConfigTable.$inferSelect;

/** For the storefront layout — returns null if not found or inactive. */
export async function getSupportWidgetConfig(): Promise<SupportWidgetConfig | null> {
  const row = await db.query.supportWidgetConfigTable.findFirst();

  if (!row || !row.isActive) return null;

  return row;
}

/** For the admin form — returns row regardless of isActive. */
export async function getSupportWidgetConfigRaw(): Promise<SupportWidgetConfig | null> {
  const row = await db.query.supportWidgetConfigTable.findFirst();
  return row ?? null;
}
