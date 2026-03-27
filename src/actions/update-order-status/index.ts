"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";

import { db } from "@/db";
import { orderTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type UpdateOrderStatusInput,
  updateOrderStatusSchema,
} from "./schema";

type Result = { success: boolean; message: string };

export async function updateOrderStatus(
  input: UpdateOrderStatusInput,
): Promise<Result> {
  await requireAdminSessionOrThrow();

  const payload = updateOrderStatusSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { orderId, status, trackingCode, trackingUrl, statusNote } =
    payload.data;

  const order = await db.query.orderTable.findFirst({
    where: eq(orderTable.id, orderId),
    columns: { id: true, stripePaymentIntentId: true },
  });

  if (!order) {
    return { success: false, message: "Pedido não encontrado." };
  }

  if (status === "refunded" && order.stripePaymentIntentId) {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { success: false, message: "Configuração do Stripe ausente." };
    }
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      await stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
      });
    } catch {
      return {
        success: false,
        message: "Erro ao processar reembolso no Stripe.",
      };
    }
  }

  const now = new Date();

  await db
    .update(orderTable)
    .set({
      status,
      trackingCode: trackingCode || null,
      trackingUrl: trackingUrl || null,
      statusNote: statusNote || null,
      ...(status === "shipped" && { shippedAt: now }),
      ...(status === "delivered" && { deliveredAt: now }),
      ...(status === "canceled" && { canceledAt: now }),
      ...(status === "refunded" && { refundedAt: now }),
    })
    .where(eq(orderTable.id, orderId));

  revalidatePath("/");
  revalidatePath("/admin/pedidos");

  return { success: true, message: "Status atualizado com sucesso." };
}
