"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { couponTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import { type CreateCouponInput, createCouponSchema } from "./schema";

type Result = { success: boolean; message: string };

export async function createCoupon(input: CreateCouponInput): Promise<Result> {
  await requireAdminSessionOrThrow();

  const payload = createCouponSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const data = payload.data;

  await db.insert(couponTable).values({
    code: data.code,
    description: data.description || null,
    type: data.type,
    value: data.value,
    categoryId: data.categoryId || null,
    minOrderValueInCents: data.minOrderValueInCents,
    maxDiscountInCents: data.maxDiscountInCents ?? null,
    maxUsesTotal: data.maxUsesTotal ?? null,
    maxUsesPerUser: data.maxUsesPerUser,
    isFirstOrderOnly: data.isFirstOrderOnly,
    isActive: data.isActive,
    startsAt: data.startsAt ? new Date(data.startsAt) : null,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
  });

  revalidatePath("/admin/cupons");

  return { success: true, message: "Cupom criado com sucesso." };
}
