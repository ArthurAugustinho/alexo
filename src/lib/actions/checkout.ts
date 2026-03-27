"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import Stripe from "stripe";
import { z } from "zod";

import { db } from "@/db";
import {
  cartItemTable,
  cartTable,
  orderItemTable,
  orderTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";

const checkoutSessionSchema = z.object({
  orderId: z.uuid(),
});

type ActionResult = { success: boolean; message: string };

export const finishOrder = async (input: {
  shippingCostInCents: number;
}): Promise<ActionResult & { orderId?: string }> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, message: "Não autorizado." };

  if (
    !Number.isInteger(input.shippingCostInCents) ||
    input.shippingCostInCents < 0
  )
    return { success: false, message: "Custo de frete inválido." };

  const cart = await db.query.cartTable.findFirst({
    where: eq(cartTable.userId, session.user.id),
    with: {
      shippingAddress: true,
      items: { with: { productVariant: true } },
    },
  });
  if (!cart) return { success: false, message: "Carrinho não encontrado." };
  if (!cart.shippingAddress)
    return { success: false, message: "Endereço de entrega não informado." };
  if (cart.items.some((item) => !item.productVariant.isAvailable))
    return {
      success: false,
      message: "Uma ou mais variantes do carrinho estão indisponíveis.",
    };

  const subtotalInCents = cart.items.reduce(
    (acc, item) => acc + item.productVariant.priceInCents * item.quantity,
    0,
  );
  const discountInCents = cart.discountInCents ?? 0;
  const totalPriceInCents = Math.max(
    0,
    subtotalInCents - discountInCents + input.shippingCostInCents,
  );

  let orderId: string | undefined;

  await db.transaction(async (tx) => {
    if (!cart.shippingAddress) throw new Error("Endereço de entrega ausente.");

    const [order] = await tx
      .insert(orderTable)
      .values({
        email: cart.shippingAddress.email || session.user.email,
        zipCode: cart.shippingAddress.zipCode,
        country: cart.shippingAddress.country,
        phone: cart.shippingAddress.phone,
        cpfOrCnpj: cart.shippingAddress.cpfOrCnpj || "",
        city: cart.shippingAddress.city,
        complement: cart.shippingAddress.complement,
        neighborhood: cart.shippingAddress.neighborhood,
        number: cart.shippingAddress.number,
        recipientName: cart.shippingAddress.recipientName,
        state: cart.shippingAddress.state,
        street: cart.shippingAddress.street,
        userId: session.user.id,
        totalPriceInCents,
        shippingAddressId: cart.shippingAddress.id,
        originalTotalInCents: subtotalInCents,
        discountInCents,
        couponCode: cart.appliedCouponCode ?? null,
      })
      .returning();

    if (!order) throw new Error("Falha ao criar pedido.");

    orderId = order.id;

    await tx.insert(orderItemTable).values(
      cart.items.map((item) => ({
        orderId: order.id,
        productVariantId: item.productVariant.id,
        quantity: item.quantity,
        priceInCents: item.productVariant.priceInCents,
      })),
    );

    await tx.delete(cartItemTable).where(eq(cartItemTable.cartId, cart.id));
    await tx.delete(cartTable).where(eq(cartTable.id, cart.id));
  });

  if (!orderId) return { success: false, message: "Falha ao criar pedido." };

  return { success: true, message: "Pedido criado com sucesso.", orderId };
};

export const createCheckoutSession = async (data: {
  orderId: string;
}): Promise<ActionResult & { sessionId?: string }> => {
  if (!process.env.STRIPE_SECRET_KEY)
    return {
      success: false,
      message: "Configuração de pagamento indisponível.",
    };
  if (!process.env.NEXT_PUBLIC_APP_URL)
    return { success: false, message: "URL da aplicação não configurada." };

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false, message: "Não autorizado." };

  const payload = checkoutSessionSchema.safeParse(data);
  if (!payload.success)
    return { success: false, message: "ID do pedido inválido." };

  const order = await db.query.orderTable.findFirst({
    where: eq(orderTable.id, payload.data.orderId),
  });
  if (!order) return { success: false, message: "Pedido não encontrado." };
  if (order.userId !== session.user.id)
    return { success: false, message: "Não autorizado." };

  const orderItems = await db.query.orderItemTable.findMany({
    where: eq(orderItemTable.orderId, payload.data.orderId),
    with: { productVariant: { with: { product: true } } },
  });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?orderId=${payload.data.orderId}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel?orderId=${payload.data.orderId}`,
    metadata: { orderId: payload.data.orderId },
    line_items: orderItems.map((orderItem) => ({
      price_data: {
        currency: "brl",
        product_data: {
          name: `${orderItem.productVariant.product.name} - ${orderItem.productVariant.name}`,
          description: orderItem.productVariant.product.description,
          images: [orderItem.productVariant.imageUrl],
        },
        unit_amount: orderItem.priceInCents,
      },
      quantity: orderItem.quantity,
    })),
  });

  return {
    success: true,
    message: "Sessão de pagamento criada.",
    sessionId: checkoutSession.id,
  };
};
