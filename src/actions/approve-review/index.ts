"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { productReviewTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import { type ApproveReviewInput,approveReviewSchema } from "./schema";

type Result = { success: boolean; message: string };

export async function approveReview(input: ApproveReviewInput): Promise<Result> {
  await requireAdminSessionOrThrow();

  const payload = approveReviewSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const review = await db.query.productReviewTable.findFirst({
    where: eq(productReviewTable.id, payload.data.reviewId),
    columns: { id: true, productId: true },
  });

  if (!review) {
    return { success: false, message: "Avaliação não encontrada." };
  }

  await db
    .update(productReviewTable)
    .set({ isApproved: true })
    .where(eq(productReviewTable.id, payload.data.reviewId));

  revalidatePath("/admin/avaliacoes");
  revalidatePath(`/product`);

  return { success: true, message: "Avaliação aprovada." };
}
