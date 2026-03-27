"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { productReviewTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import { type DeleteReviewInput,deleteReviewSchema } from "./schema";

type Result = { success: boolean; message: string };

export async function deleteReview(input: DeleteReviewInput): Promise<Result> {
  await requireAdminSessionOrThrow();

  const payload = deleteReviewSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await db
    .delete(productReviewTable)
    .where(eq(productReviewTable.id, payload.data.reviewId));

  revalidatePath("/admin/avaliacoes");
  revalidatePath(`/product`);

  return { success: true, message: "Avaliação removida." };
}
