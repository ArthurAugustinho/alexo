"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { productTable, wishlistItemTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getWishlistProductIds } from "@/lib/queries/wishlist";

const wishlistProductSchema = z.object({
  productId: z.uuid(),
});

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.id) {
    throw new Error("Faca login para acessar sua lista de desejos.");
  }

  return session.user;
}

async function revalidateWishlistPaths(productId: string) {
  revalidatePath("/wishlist");

  const product = await db.query.productTable.findFirst({
    where: eq(productTable.id, productId),
  });

  if (product) {
    revalidatePath(`/product/${product.slug}`);
  }
}

export async function getWishlistProductIdsForCurrentUser(): Promise<string[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.id) {
    return [];
  }

  return getWishlistProductIds(session.user.id);
}

export async function toggleWishlist(productId: string): Promise<{ added: boolean }> {
  const payload = wishlistProductSchema.parse({
    productId,
  });
  const user = await getAuthenticatedUser();

  const existingWishlistItem = await db.query.wishlistItemTable.findFirst({
    where: and(
      eq(wishlistItemTable.userId, user.id),
      eq(wishlistItemTable.productId, payload.productId),
    ),
  });

  if (existingWishlistItem) {
    await db
      .delete(wishlistItemTable)
      .where(eq(wishlistItemTable.id, existingWishlistItem.id));

    await revalidateWishlistPaths(payload.productId);

    return {
      added: false,
    };
  }

  await db.insert(wishlistItemTable).values({
    userId: user.id,
    productId: payload.productId,
  });

  await revalidateWishlistPaths(payload.productId);

  return {
    added: true,
  };
}

export async function removeFromWishlist(
  productId: string,
): Promise<{ success: boolean }> {
  const payload = wishlistProductSchema.parse({
    productId,
  });
  const user = await getAuthenticatedUser();

  await db
    .delete(wishlistItemTable)
    .where(
      and(
        eq(wishlistItemTable.userId, user.id),
        eq(wishlistItemTable.productId, payload.productId),
      ),
    );

  await revalidateWishlistPaths(payload.productId);

  return {
    success: true,
  };
}

export async function clearWishlist(): Promise<{ success: boolean }> {
  const user = await getAuthenticatedUser();

  await db
    .delete(wishlistItemTable)
    .where(eq(wishlistItemTable.userId, user.id));

  revalidatePath("/wishlist");

  return {
    success: true,
  };
}
