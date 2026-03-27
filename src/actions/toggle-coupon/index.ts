"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { couponTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import { type ToggleCouponInput, toggleCouponSchema } from "./schema";

type Result = { success: boolean; message: string };

export async function toggleCoupon(input: ToggleCouponInput): Promise<Result> {
  await requireAdminSessionOrThrow();

  const payload = toggleCouponSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await db
    .update(couponTable)
    .set({ isActive: payload.data.isActive, updatedAt: new Date() })
    .where(eq(couponTable.id, payload.data.couponId));

  revalidatePath("/admin/cupons");

  return {
    success: true,
    message: payload.data.isActive ? "Cupom ativado." : "Cupom desativado.",
  };
}
