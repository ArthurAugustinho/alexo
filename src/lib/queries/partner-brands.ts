"use server";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { partnerBrandTable } from "@/db/schema";

export type PartnerBrand = typeof partnerBrandTable.$inferSelect;

export async function getActivePartnerBrands(): Promise<PartnerBrand[]> {
  return db.query.partnerBrandTable.findMany({
    where: eq(partnerBrandTable.isActive, true),
    orderBy: [asc(partnerBrandTable.position)],
  });
}

export async function getAllPartnerBrands(): Promise<PartnerBrand[]> {
  return db.query.partnerBrandTable.findMany({
    orderBy: [asc(partnerBrandTable.position)],
  });
}

export async function getPartnerBrandById(
  id: string,
): Promise<PartnerBrand | undefined> {
  return db.query.partnerBrandTable.findFirst({
    where: eq(partnerBrandTable.id, id),
  });
}
