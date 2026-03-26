"use server";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { faqItemTable } from "@/db/schema";

export type FaqItem = typeof faqItemTable.$inferSelect;

export async function getActiveFaqItems(): Promise<FaqItem[]> {
  return db.query.faqItemTable.findMany({
    where: eq(faqItemTable.isActive, true),
    orderBy: [asc(faqItemTable.position)],
  });
}

export async function getAllFaqItems(): Promise<FaqItem[]> {
  return db.query.faqItemTable.findMany({
    orderBy: [asc(faqItemTable.position)],
  });
}

export async function getFaqItemById(
  id: string,
): Promise<FaqItem | undefined> {
  return db.query.faqItemTable.findFirst({
    where: eq(faqItemTable.id, id),
  });
}
