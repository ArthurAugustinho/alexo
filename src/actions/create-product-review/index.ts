"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { productReviewTable } from "@/db/schema";
import { auth } from "@/lib/auth";

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

  const existing = await db.query.productReviewTable.findFirst({
    where: (t, { and, eq }) =>
      and(
        eq(t.userId, session.user.id),
        eq(t.productId, payload.data.productId),
      ),
    columns: { id: true },
  });

  if (existing) {
    return {
      success: false,
      message: "Você já avaliou este produto.",
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
