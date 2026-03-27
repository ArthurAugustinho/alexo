"use server";

import { count, desc, eq } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";

import { db } from "@/db";
import { returnRequestTable } from "@/db/schema";

export type ReturnRequest = {
  id: string;
  orderId: string;
  userId: string;
  reason: "defect" | "wrong_item" | "damaged" | "wrong_size" | "other";
  description: string;
  photoUrl: string | null;
  status: "pending_review" | "approved" | "rejected" | "completed";
  adminNote: string | null;
  returnCode: string | null;
  returnUrl: string | null;
  reviewedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
};

export type ReturnRequestWithOrder = ReturnRequest & {
  user: { name: string; email: string };
};

export async function getReturnRequestByOrder(
  orderId: string,
): Promise<ReturnRequest | null> {
  noStore();

  const row = await db.query.returnRequestTable.findFirst({
    where: eq(returnRequestTable.orderId, orderId),
  });

  return row ?? null;
}

export async function getReturnRequestsByUser(
  userId: string,
): Promise<ReturnRequest[]> {
  noStore();

  return db.query.returnRequestTable.findMany({
    where: eq(returnRequestTable.userId, userId),
    orderBy: [desc(returnRequestTable.createdAt)],
  });
}

export async function getAllReturnRequests(filters?: {
  status?: string;
}): Promise<ReturnRequestWithOrder[]> {
  noStore();

  const rows = await db.query.returnRequestTable.findMany({
    orderBy: [desc(returnRequestTable.createdAt)],
    with: {
      user: {
        columns: { name: true, email: true },
      },
    },
  });

  const filtered = filters?.status
    ? rows.filter((r) => r.status === filters.status)
    : rows;

  return filtered.map((row) => ({
    id: row.id,
    orderId: row.orderId,
    userId: row.userId,
    reason: row.reason,
    description: row.description,
    photoUrl: row.photoUrl,
    status: row.status,
    adminNote: row.adminNote,
    returnCode: row.returnCode,
    returnUrl: row.returnUrl,
    reviewedAt: row.reviewedAt,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    user: { name: row.user.name, email: row.user.email },
  }));
}

export async function getPendingReturnRequestsCount(): Promise<number> {
  noStore();

  const [result] = await db
    .select({ count: count() })
    .from(returnRequestTable)
    .where(eq(returnRequestTable.status, "pending_review"));

  return result?.count ?? 0;
}
