"use server";

import { and, count, desc, eq } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";

import { db } from "@/db";
import { couponTable, couponUsageTable, orderTable } from "@/db/schema";

export type CouponWithStats = typeof couponTable.$inferSelect & {
  totalUsages: number;
  categoryName: string | null;
};

export async function getCouponByCode(
  code: string,
): Promise<typeof couponTable.$inferSelect | null> {
  noStore();

  const row = await db.query.couponTable.findFirst({
    where: eq(couponTable.code, code.toUpperCase()),
  });

  return row ?? null;
}

export async function getCouponUsageCount(couponId: string): Promise<number> {
  noStore();

  const [result] = await db
    .select({ count: count() })
    .from(couponUsageTable)
    .where(eq(couponUsageTable.couponId, couponId));

  return result?.count ?? 0;
}

export async function getCouponUsageByUser(
  couponId: string,
  userId: string,
): Promise<number> {
  noStore();

  const [result] = await db
    .select({ count: count() })
    .from(couponUsageTable)
    .where(
      and(eq(couponUsageTable.couponId, couponId), eq(couponUsageTable.userId, userId)),
    );

  return result?.count ?? 0;
}

export async function getAllCoupons(): Promise<CouponWithStats[]> {
  noStore();

  const coupons = await db.query.couponTable.findMany({
    orderBy: [desc(couponTable.createdAt)],
    with: {
      category: { columns: { name: true } },
      usages: { columns: { id: true } },
    },
  });

  return coupons.map((c) => ({
    ...c,
    totalUsages: c.usages.length,
    categoryName: c.category?.name ?? null,
  }));
}

export async function isFirstOrderForUser(userId: string): Promise<boolean> {
  noStore();

  const [result] = await db
    .select({ count: count() })
    .from(orderTable)
    .where(eq(orderTable.userId, userId));

  return (result?.count ?? 0) === 0;
}
