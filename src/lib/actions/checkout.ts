"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import {
  cartItemTable,
  cartTable,
  orderItemTable,
  orderTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";

type ActionResult = { success: boolean; message: string };

export const finishOrder = async (): Promise<
  ActionResult & { orderId?: string }
> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, message: "Não autorizado." };

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
    (acc, item) =>
      acc +
      item.productVariant.priceInCents * item.quantity +
      (item.customizationExtraInCents ?? 0),
    0,
  );
  const shippingCostInCents = cart.items.reduce(
    (acc, item) => acc + (item.shippingCostInCents ?? 0),
    0,
  );
  const discountInCents = cart.discountInCents ?? 0;
  const totalPriceInCents = Math.max(
    0,
    subtotalInCents - discountInCents + shippingCostInCents,
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
        shippingCostInCents,
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
        customizationName: item.customizationName ?? null,
        customizationNumber: item.customizationNumber ?? null,
        customizationPatchText: item.customizationPatchId ?? null,
        customizationExtraInCents: item.customizationExtraInCents ?? 0,
      })),
    );

    await tx.delete(cartItemTable).where(eq(cartItemTable.cartId, cart.id));
    await tx.delete(cartTable).where(eq(cartTable.id, cart.id));
  });

  if (!orderId) return { success: false, message: "Falha ao criar pedido." };

  return { success: true, message: "Pedido criado com sucesso.", orderId };
};
