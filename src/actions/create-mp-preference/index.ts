"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { orderItemTable, orderTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { preference } from "@/lib/mercadopago";
import { finishOrder } from "@/lib/actions/checkout";

type ActionResult =
  | { success: true; initPoint: string }
  | { success: false; message: string };

export const createMpPreference = async (): Promise<ActionResult> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, message: "Não autorizado." };

  // 1. Criar o pedido primeiro — o carrinho é deletado aqui
  const orderResult = await finishOrder();
  if (!orderResult.success || !orderResult.orderId) {
    return { success: false, message: orderResult.message };
  }

  const orderId = orderResult.orderId;

  // 2. Buscar o pedido com seus itens para montar a preferência
  const order = await db.query.orderTable.findFirst({
    where: eq(orderTable.id, orderId),
    with: {
      items: {
        with: { productVariant: { with: { product: true } } },
      },
    },
  });

  if (!order) {
    return { success: false, message: "Pedido não encontrado após criação." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // 3. Criar preferência no Mercado Pago
  const response = await preference.create({
    body: {
      external_reference: orderId,
      items: order.items.map((item) => ({
        id: item.productVariantId,
        title: `${item.productVariant.product.name} — ${item.productVariant.name}`,
        quantity: item.quantity,
        unit_price:
          (item.priceInCents + (item.customizationExtraInCents ?? 0)) / 100,
        currency_id: "BRL",
      })),
      payer: {
        name: order.recipientName,
        email: order.email,
      },
      back_urls: {
        success: `${appUrl}/checkout/success`,
        failure: `${appUrl}/checkout/cancel`,
        pending: `${appUrl}/checkout/pending`,
      },
      auto_return: "approved",
      notification_url: `${appUrl}/api/mercadopago/webhook`,
    },
  });

  if (!response.init_point) {
    return {
      success: false,
      message: "Erro ao gerar link de pagamento. Tente novamente.",
    };
  }

  return { success: true, initPoint: response.init_point };
};
