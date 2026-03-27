"use server";

import { asc, desc, eq } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";

import { db } from "@/db";
import { shippingAddressTable } from "@/db/schema";

export type ShippingAddress = typeof shippingAddressTable.$inferSelect;

export async function getAddressesByUser(
  userId: string,
): Promise<ShippingAddress[]> {
  noStore();

  return db.query.shippingAddressTable.findMany({
    where: eq(shippingAddressTable.userId, userId),
    orderBy: [desc(shippingAddressTable.isDefault), asc(shippingAddressTable.createdAt)],
  });
}

export async function getDefaultAddress(
  userId: string,
): Promise<ShippingAddress | null> {
  noStore();

  const row = await db.query.shippingAddressTable.findFirst({
    where: eq(shippingAddressTable.userId, userId),
    orderBy: [desc(shippingAddressTable.isDefault)],
  });

  return row ?? null;
}

export async function getAddressById(
  addressId: string,
  userId: string,
): Promise<ShippingAddress | null> {
  noStore();

  const row = await db.query.shippingAddressTable.findFirst({
    where: (t, { and }) => and(
      eq(t.id, addressId),
      eq(t.userId, userId),
    ),
  });

  return row ?? null;
}
