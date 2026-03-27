"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import {
  cartItemTable,
  cartTable,
  couponUsageTable,
  orderItemTable,
  orderTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { getCouponByCode } from "@/lib/queries/coupons";

export const finishOrder = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error("Unauthorized");
  }

  const cart = await db.query.cartTable.findFirst({
    where: eq(cartTable.userId, session.user.id),
    with: {
      shippingAddress: true,
      items: {
        with: {
          productVariant: true,
        },
      },
    },
  });
  if (!cart) {
    throw new Error("Cart not found");
  }
  if (!cart.shippingAddress) {
    throw new Error("Shipping address not found");
  }
  if (cart.items.some((item) => !item.productVariant.isAvailable)) {
    throw new Error("Uma ou mais variantes do carrinho estão indisponíveis.");
  }

  const originalTotalInCents = cart.items.reduce(
    (acc, item) => acc + item.productVariant.priceInCents * item.quantity,
    0,
  );

  const discountInCents = cart.discountInCents ?? 0;
  const appliedCouponCode = cart.appliedCouponCode ?? null;
  const totalPriceInCents = Math.max(0, originalTotalInCents - discountInCents);

  let couponId: string | null = null;
  let discountType: string | null = null;

  if (appliedCouponCode) {
    const coupon = await getCouponByCode(appliedCouponCode);
    if (coupon) {
      couponId = coupon.id;
      discountType = coupon.type;
    }
  }

  let orderId: string | undefined;

  await db.transaction(async (tx) => {
    if (!cart.shippingAddress) {
      throw new Error("Shipping address not found");
    }

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
        shippingAddressId: cart.shippingAddress!.id,
        originalTotalInCents,
        discountInCents,
        couponCode: appliedCouponCode,
        discountType,
      })
      .returning();

    if (!order) {
      throw new Error("Failed to create order");
    }

    orderId = order.id;

    const orderItemsPayload: Array<typeof orderItemTable.$inferInsert> =
      cart.items.map((item) => ({
        orderId: order.id,
        productVariantId: item.productVariant.id,
        quantity: item.quantity,
        priceInCents: item.productVariant.priceInCents,
      }));

    await tx.insert(orderItemTable).values(orderItemsPayload);

    if (couponId && discountInCents > 0) {
      await tx.insert(couponUsageTable).values({
        couponId,
        userId: session.user.id,
        orderId: order.id,
        discountAppliedInCents: discountInCents,
      });
    }

    await tx.delete(cartItemTable).where(eq(cartItemTable.cartId, cart.id));
    await tx.delete(cartTable).where(eq(cartTable.id, cart.id));
  });

  if (!orderId) {
    throw new Error("Failed to create order");
  }

  return { orderId };
};
