"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  type AddFeaturedProductInput,
  addFeaturedProductSchema,
} from "@/actions/admin-showcase/schema";
import { db } from "@/db";
import { featuredProductTable, productTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

type FeaturedProductActionResult = {
  success: boolean;
  message: string;
};

export async function addAdminFeaturedProduct(
  input: AddFeaturedProductInput,
): Promise<FeaturedProductActionResult> {
  const payload = addFeaturedProductSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Produto inválido.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  const existingProduct = await db.query.productTable.findFirst({
    where: eq(productTable.id, payload.data.productId),
  });

  if (!existingProduct) {
    return {
      success: false,
      message: "Produto não encontrado.",
    };
  }

  const featuredProducts = await db.query.featuredProductTable.findMany({
    orderBy: [asc(featuredProductTable.position)],
  });

  if (featuredProducts.some((item) => item.productId === payload.data.productId)) {
    return {
      success: false,
      message: "Esse produto já está na lista de destaque.",
    };
  }

  if (featuredProducts.length >= 10) {
    return {
      success: false,
      message: "A lista de destaque aceita no máximo 10 produtos.",
    };
  }

  await db.insert(featuredProductTable).values({
    productId: payload.data.productId,
    position: featuredProducts.length,
  });

  revalidatePath("/");
  revalidatePath("/admin/vitrine/mais-vendidos");

  return {
    success: true,
    message: "Produto adicionado à curadoria manual.",
  };
}
