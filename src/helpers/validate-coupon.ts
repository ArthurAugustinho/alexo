import type { couponTable } from "@/db/schema";

export type Coupon = typeof couponTable.$inferSelect;

export type CartItemForCoupon = {
  priceInCents: number;
  quantity: number;
  categoryId: string;
};

export type CouponValidationResult =
  | { valid: true; discountInCents: number; message: string }
  | { valid: false; message: string };

export type ValidateCouponParams = {
  coupon: Coupon;
  cartTotalInCents: number;
  cartItems: CartItemForCoupon[];
  usageCount: number;
  userUsageCount: number;
  isFirstOrder: boolean;
};

export function validateCoupon(
  params: ValidateCouponParams,
): CouponValidationResult {
  const {
    coupon,
    cartTotalInCents,
    cartItems,
    usageCount,
    userUsageCount,
    isFirstOrder,
  } = params;

  if (!coupon.isActive) {
    return { valid: false, message: "Cupom inválido ou expirado." };
  }

  const now = new Date();

  if (coupon.startsAt && coupon.startsAt > now) {
    return { valid: false, message: "Este cupom ainda não está ativo." };
  }

  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { valid: false, message: "Este cupom expirou." };
  }

  if (coupon.isFirstOrderOnly && !isFirstOrder) {
    return {
      valid: false,
      message: "Este cupom é válido apenas para o primeiro pedido.",
    };
  }

  if (
    coupon.maxUsesTotal !== null &&
    coupon.maxUsesTotal !== undefined &&
    usageCount >= coupon.maxUsesTotal
  ) {
    return {
      valid: false,
      message: "Este cupom atingiu o limite de usos.",
    };
  }

  if (userUsageCount >= coupon.maxUsesPerUser) {
    return { valid: false, message: "Você já utilizou este cupom." };
  }

  if (
    coupon.minOrderValueInCents > 0 &&
    cartTotalInCents < coupon.minOrderValueInCents
  ) {
    const minFormatted = (coupon.minOrderValueInCents / 100).toLocaleString(
      "pt-BR",
      { style: "currency", currency: "BRL" },
    );
    return {
      valid: false,
      message: `Pedido mínimo de ${minFormatted} para usar este cupom.`,
    };
  }

  let discountInCents = 0;

  if (coupon.type === "percentage") {
    const raw = Math.floor((cartTotalInCents * coupon.value) / 100);
    discountInCents =
      coupon.maxDiscountInCents !== null && coupon.maxDiscountInCents !== undefined
        ? Math.min(raw, coupon.maxDiscountInCents)
        : raw;
  } else if (coupon.type === "fixed") {
    discountInCents = Math.min(coupon.value, cartTotalInCents);
  } else if (coupon.type === "free_shipping") {
    discountInCents = 0;
  } else if (coupon.type === "category") {
    if (!coupon.categoryId) {
      return { valid: false, message: "Cupom de categoria sem categoria configurada." };
    }
    const eligibleItems = cartItems.filter(
      (item) => item.categoryId === coupon.categoryId,
    );
    if (eligibleItems.length === 0) {
      return {
        valid: false,
        message: "Nenhum item do carrinho é elegível para este cupom.",
      };
    }
    const eligibleTotal = eligibleItems.reduce(
      (sum, item) => sum + item.priceInCents * item.quantity,
      0,
    );
    discountInCents = Math.floor((eligibleTotal * coupon.value) / 100);
  }

  discountInCents = Math.min(discountInCents, cartTotalInCents);

  return {
    valid: true,
    discountInCents,
    message: `Cupom ${coupon.code} aplicado com sucesso!`,
  };
}
