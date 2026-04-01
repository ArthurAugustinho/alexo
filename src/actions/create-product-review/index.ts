"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { productReviewTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { canUserReviewProduct } from "@/lib/queries/reviews";

import {
  type CreateProductReviewInput,
  createProductReviewSchema,
} from "./schema";

type Result = { success: boolean; message: string };

export async function createProductReview(
  input: CreateProductReviewInput,
): Promise<Result> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, message: "Você precisa estar logado para avaliar." };
  }

  const payload = createProductReviewSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const eligible = await canUserReviewProduct(session.user.id, payload.data.productId);

  if (!eligible) {
    return {
      success: false,
      message: "Você precisa ter recebido este produto para avaliá-lo.",
    };
  }

  await db.insert(productReviewTable).values({
    productId: payload.data.productId,
    userId: session.user.id,
    rating: payload.data.rating,
    title: payload.data.title ?? null,
    body: payload.data.body ?? null,
    photoUrls: payload.data.photoUrls,
    isApproved: false,
  });

  revalidatePath(`/product`);

  return { success: true, message: "Avaliação enviada! Ela será publicada após aprovação." };
}
