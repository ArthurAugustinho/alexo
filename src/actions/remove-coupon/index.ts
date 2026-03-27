"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { cartTable } from "@/db/schema";
import { auth } from "@/lib/auth";

type Result = { success: boolean; message: string };

export async function removeCoupon(): Promise<Result> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, message: "Você precisa estar logado." };
  }

  await db
    .update(cartTable)
    .set({ appliedCouponCode: null, discountInCents: 0 })
    .where(eq(cartTable.userId, session.user.id));

  revalidatePath("/cart/confirmation");

  return { success: true, message: "Cupom removido." };
}
