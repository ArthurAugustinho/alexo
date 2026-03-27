"use server";

import { unstable_noStore as noStore } from "next/cache";

import { db } from "@/db";
import { logisticsConfigTable } from "@/db/schema";

export type LogisticsConfig = typeof logisticsConfigTable.$inferSelect;

export async function getLogisticsConfig(): Promise<LogisticsConfig | null> {
  noStore();

  const row = await db.query.logisticsConfigTable.findFirst();

  return row ?? null;
}
