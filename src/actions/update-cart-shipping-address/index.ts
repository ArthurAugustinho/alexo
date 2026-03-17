"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { cartTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import {
  UpdateCartShippingAddressSchema,
  updateCartShippingAddressSchema,
} from "./schema";

export const updateCartShippingAddress = async (
  data: UpdateCartShippingAddressSchema,
) => {
  updateCartShippingAddressSchema.parse(data);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const shippingAddress = await db.query.shippingAddressTable.findFirst({
    where: (address, { eq }) => eq(address.id, data.shippingAddressId),
  });

  if (!shippingAddress) {
    throw new Error("Shipping address not found");
  }

  if (shippingAddress.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  const cart = await db.query.cartTable.findFirst({
    where: (cart, { eq }) => eq(cart.userId, session.user.id),
  });

  let cartId = cart?.id;

  if (!cartId) {
    const [newCart] = await db
      .insert(cartTable)
      .values({ userId: session.user.id })
      .returning();
    cartId = newCart.id;
  }

  await db
    .update(cartTable)
    .set({
      shippingAddressId: shippingAddress.id,
    })
    .where(eq(cartTable.id, cartId));

  // Keep server-rendered cart steps fresh after address change
  revalidatePath("/cart/identification");
  revalidatePath("/cart/confirmation");
};
