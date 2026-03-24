"use server";

import { asc } from "drizzle-orm";

import { db } from "@/db";
import { categoryTable } from "@/db/schema";

export type Category = typeof categoryTable.$inferSelect;

export async function getAllCategories(): Promise<Category[]> {
  return db.query.categoryTable.findMany({
    orderBy: [asc(categoryTable.name)],
  });
}
