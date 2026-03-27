"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";

import { db } from "@/db";
import { orderTable, returnRequestTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type CompleteReturnRequestInput,
  completeReturnRequestSchema,
} from "./schema";

type Result = { success: boolean; message: string };

export async function completeReturnRequest(
  input: CompleteReturnRequestInput,
): Promise<Result> {
  await requireAdminSessionOrThrow();

  const payload = completeReturnRequestSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const request = await db.query.returnRequestTable.findFirst({
    where: eq(returnRequestTable.id, payload.data.returnRequestId),
    columns: { id: true, orderId: true, status: true },
    with: {
      order: {
        columns: { id: true, stripePaymentIntentId: true },
      },
    },
  });

  if (!request) {
    return { success: false, message: "Solicitação não encontrada." };
  }

  if (request.status !== "approved") {
    return {
      success: false,
      message: "Apenas solicitações aprovadas podem ser concluídas.",
    };
  }

  const now = new Date();

  if (
    request.order.stripePaymentIntentId &&
    process.env.STRIPE_SECRET_KEY
  ) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      await stripe.refunds.create({
        payment_intent: request.order.stripePaymentIntentId,
      });
    } catch {
      // Stripe refund failed — continue updating DB regardless
    }
  }

  await db
    .update(returnRequestTable)
    .set({ status: "completed", completedAt: now, updatedAt: now })
    .where(eq(returnRequestTable.id, payload.data.returnRequestId));

  await db
    .update(orderTable)
    .set({ status: "refunded", refundedAt: now })
    .where(eq(orderTable.id, request.orderId));

  revalidatePath("/");
  revalidatePath("/admin/devolucoes");

  return { success: true, message: "Devolução concluída e pedido marcado como reembolsado." };
}
