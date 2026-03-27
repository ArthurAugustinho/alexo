"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { cartTable } from "@/db/schema";
import { validateCoupon } from "@/helpers/validate-coupon";
import { auth } from "@/lib/auth";
import {
  getCouponByCode,
  getCouponUsageByUser,
  getCouponUsageCount,
  isFirstOrderForUser,
} from "@/lib/queries/coupons";

import { type ApplyCouponInput, applyCouponSchema } from "./schema";

type Result =
  | { valid: true; discountInCents: number; message: string }
  | { valid: false; message: string };

export async function applyCoupon(input: ApplyCouponInput): Promise<Result> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { valid: false, message: "Você precisa estar logado." };
  }

  const payload = applyCouponSchema.safeParse(input);

  if (!payload.success) {
    return {
      valid: false,
      message: payload.error.issues[0]?.message ?? "Código inválido.",
    };
  }

  const { code } = payload.data;

  const coupon = await getCouponByCode(code);

  if (!coupon) {
    return { valid: false, message: "Cupom não encontrado." };
  }

  const cart = await db.query.cartTable.findFirst({
    where: eq(cartTable.userId, session.user.id),
    with: {
      items: {
        with: {
          productVariant: {
            columns: { priceInCents: true },
            with: {
              product: { columns: { categoryId: true } },
            },
          },
        },
        columns: { quantity: true },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return { valid: false, message: "Seu carrinho está vazio." };
  }

  const cartTotalInCents = cart.items.reduce(
    (sum, item) => sum + item.productVariant.priceInCents * item.quantity,
    0,
  );

  const cartItems = cart.items.map((item) => ({
    priceInCents: item.productVariant.priceInCents,
    quantity: item.quantity,
    categoryId: item.productVariant.product.categoryId,
  }));

  const [usageCount, userUsageCount, isFirstOrder] = await Promise.all([
    getCouponUsageCount(coupon.id),
    getCouponUsageByUser(coupon.id, session.user.id),
    isFirstOrderForUser(session.user.id),
  ]);

  const result = validateCoupon({
    coupon,
    cartTotalInCents,
    cartItems,
    usageCount,
    userUsageCount,
    isFirstOrder,
  });

  if (!result.valid) {
    return result;
  }

  await db
    .update(cartTable)
    .set({
      appliedCouponCode: code,
      discountInCents: result.discountInCents,
    })
    .where(eq(cartTable.id, cart.id));

  revalidatePath("/cart/confirmation");

  return result;
}
