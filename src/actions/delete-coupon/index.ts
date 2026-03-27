"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { couponTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import { type DeleteCouponInput, deleteCouponSchema } from "./schema";

type Result = { success: boolean; message: string };

export async function deleteCoupon(input: DeleteCouponInput): Promise<Result> {
  await requireAdminSessionOrThrow();

  const payload = deleteCouponSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await db.delete(couponTable).where(eq(couponTable.id, payload.data.couponId));

  revalidatePath("/admin/cupons");

  return { success: true, message: "Cupom excluído." };
}
