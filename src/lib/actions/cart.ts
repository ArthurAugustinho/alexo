"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { cartItemTable, cartTable } from "@/db/schema";
import { auth } from "@/lib/auth";

const addProductToCartSchema = z.object({
  productVariantId: z.uuid(),
  quantity: z.number().int().min(1),
  shippingCostInCents: z.number().int().min(0).default(0),
  shippingServiceName: z.string().max(100).nullable().optional(),
  shippingDaysMin: z.number().int().min(0).nullable().optional(),
  shippingDaysMax: z.number().int().min(0).nullable().optional(),
  customizationName: z.string().max(30).optional(),
  customizationNumber: z.string().max(5).optional(),
  customizationPatchId: z.string().max(100).optional(),
  customizationExtraInCents: z.number().int().min(0).default(0),
});

const cartItemIdSchema = z.object({
  cartItemId: z.uuid(),
});

export type AddProductToCartInput = z.input<typeof addProductToCartSchema>;

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

export const getCart = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const cart = await db.query.cartTable.findFirst({
    where: (cart, { eq }) => eq(cart.userId, session.user.id),
    with: {
      shippingAddress: true,
      items: {
        with: {
          productVariant: {
            with: { product: true },
          },
        },
      },
    },
  });

  if (!cart) {
    const [newCart] = await db
      .insert(cartTable)
      .values({ userId: session.user.id })
      .returning();
    return {
      ...newCart,
      items: [],
      totalPriceInCents: 0,
      shippingAddress: null,
    };
  }

  return {
    ...cart,
    totalPriceInCents: cart.items.reduce(
      (acc, item) =>
        acc +
        item.productVariant.priceInCents * item.quantity +
        (item.customizationExtraInCents ?? 0),
      0,
    ),
  };
};

export const addProductToCart = async (data: AddProductToCartInput) => {
  addProductToCartSchema.parse(data);
  const user = await getAuthenticatedUser();

  const productVariant = await db.query.productVariantTable.findFirst({
    where: (productVariant, { eq }) =>
      eq(productVariant.id, data.productVariantId),
  });
  if (!productVariant) throw new Error("Variante não encontrada.");
  if (!productVariant.isAvailable)
    throw new Error("Esta variante está indisponível no momento.");

  const cart = await db.query.cartTable.findFirst({
    where: (cart, { eq }) => eq(cart.userId, user.id),
  });

  let cartId = cart?.id;
  if (!cartId) {
    const [newCart] = await db
      .insert(cartTable)
      .values({ userId: user.id })
      .returning();
    cartId = newCart.id;
  }

  const cartItem = await db.query.cartItemTable.findFirst({
    where: (cartItem, { eq }) =>
      eq(cartItem.cartId, cartId) &&
      eq(cartItem.productVariantId, data.productVariantId),
  });

  if (cartItem) {
    await db
      .update(cartItemTable)
      .set({ quantity: cartItem.quantity + data.quantity })
      .where(eq(cartItemTable.id, cartItem.id));
    return;
  }

  await db.insert(cartItemTable).values({
    cartId,
    productVariantId: data.productVariantId,
    quantity: data.quantity,
    shippingCostInCents: data.shippingCostInCents ?? 0,
    shippingServiceName: data.shippingServiceName ?? null,
    shippingDaysMin: data.shippingDaysMin ?? null,
    shippingDaysMax: data.shippingDaysMax ?? null,
    customizationName: data.customizationName ?? null,
    customizationNumber: data.customizationNumber ?? null,
    customizationPatchId: data.customizationPatchId ?? null,
    customizationExtraInCents: data.customizationExtraInCents ?? 0,
  });
};

export const removeProductFromCart = async (data: { cartItemId: string }) => {
  cartItemIdSchema.parse(data);
  const user = await getAuthenticatedUser();

  const cartItem = await db.query.cartItemTable.findFirst({
    where: (cartItem, { eq }) => eq(cartItem.id, data.cartItemId),
    with: { cart: true },
  });
  if (!cartItem) throw new Error("Item não encontrado.");
  if (cartItem.cart.userId !== user.id) throw new Error("Unauthorized");

  await db.delete(cartItemTable).where(eq(cartItemTable.id, cartItem.id));
};

export const decreaseCartProductQuantity = async (data: {
  cartItemId: string;
}) => {
  cartItemIdSchema.parse(data);
  const user = await getAuthenticatedUser();

  const cartItem = await db.query.cartItemTable.findFirst({
    where: (cartItem, { eq }) => eq(cartItem.id, data.cartItemId),
    with: { cart: true },
  });
  if (!cartItem) throw new Error("Item não encontrado.");
  if (cartItem.cart.userId !== user.id) throw new Error("Unauthorized");

  if (cartItem.quantity === 1) {
    await db.delete(cartItemTable).where(eq(cartItemTable.id, cartItem.id));
    return;
  }

  await db
    .update(cartItemTable)
    .set({ quantity: cartItem.quantity - 1 })
    .where(eq(cartItemTable.id, cartItem.id));
};
