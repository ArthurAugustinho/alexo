"use server";

import { and, count, desc, eq } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";

import { db } from "@/db";
import { productReviewTable } from "@/db/schema";

export type ReviewWithUser = {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  body: string | null;
  photoUrls: string[];
  isApproved: boolean;
  createdAt: Date;
  user: {
    name: string;
    image: string | null;
  };
};

export type ReviewStats = {
  total: number;
  average: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

export async function getApprovedReviewsByProduct(
  productId: string,
): Promise<ReviewWithUser[]> {
  noStore();

  const rows = await db.query.productReviewTable.findMany({
    where: and(
      eq(productReviewTable.productId, productId),
      eq(productReviewTable.isApproved, true),
    ),
    orderBy: [desc(productReviewTable.createdAt)],
    with: {
      user: {
        columns: { name: true, image: true },
      },
    },
  });

  return rows.map((row) => ({
    ...row,
    user: { name: row.user.name, image: row.user.image },
  }));
}

export async function getReviewStats(productId: string): Promise<ReviewStats> {
  noStore();

  const rows = await db
    .select({ rating: productReviewTable.rating })
    .from(productReviewTable)
    .where(
      and(
        eq(productReviewTable.productId, productId),
        eq(productReviewTable.isApproved, true),
      ),
    );

  const total = rows.length;
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  let sum = 0;

  for (const row of rows) {
    const r = row.rating as 1 | 2 | 3 | 4 | 5;
    distribution[r] = (distribution[r] ?? 0) + 1;
    sum += row.rating;
  }

  return {
    total,
    average: total > 0 ? Math.round((sum / total) * 10) / 10 : 0,
    distribution,
  };
}

export async function getAllReviewsForAdmin(): Promise<ReviewWithUser[]> {
  noStore();

  const rows = await db.query.productReviewTable.findMany({
    orderBy: [desc(productReviewTable.createdAt)],
    with: {
      user: {
        columns: { name: true, image: true },
      },
    },
  });

  return rows.map((row) => ({
    ...row,
    user: { name: row.user.name, image: row.user.image },
  }));
}

export async function getPendingReviewsCount(): Promise<number> {
  noStore();

  const [result] = await db
    .select({ count: count() })
    .from(productReviewTable)
    .where(eq(productReviewTable.isApproved, false));

  return result?.count ?? 0;
}

export async function getUserReviewForProduct(
  userId: string,
  productId: string,
): Promise<{ id: string } | null> {
  noStore();

  const row = await db.query.productReviewTable.findFirst({
    where: and(
      eq(productReviewTable.userId, userId),
      eq(productReviewTable.productId, productId),
    ),
    columns: { id: true },
  });

  return row ?? null;
}
