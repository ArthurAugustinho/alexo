"use server";

import { inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { orderTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type BulkUpdateOrderStatusInput,
  bulkUpdateOrderStatusSchema,
} from "./schema";

type Result = { success: boolean; message: string; updatedCount: number };

export async function bulkUpdateOrderStatus(
  input: BulkUpdateOrderStatusInput,
): Promise<Result> {
  await requireAdminSessionOrThrow();

  const payload = bulkUpdateOrderStatusSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
      updatedCount: 0,
    };
  }

  const { orderIds, status } = payload.data;
  const now = new Date();

  const updated = await db
    .update(orderTable)
    .set({
      status,
      ...(status === "shipped" && { shippedAt: now }),
      ...(status === "delivered" && { deliveredAt: now }),
      ...(status === "canceled" && { canceledAt: now }),
      ...(status === "refunded" && { refundedAt: now }),
    })
    .where(inArray(orderTable.id, orderIds))
    .returning({ id: orderTable.id });

  revalidatePath("/admin/pedidos");

  return {
    success: true,
    message: `${updated.length} pedido${updated.length !== 1 ? "s" : ""} atualizado${updated.length !== 1 ? "s" : ""}.`,
    updatedCount: updated.length,
  };
}
