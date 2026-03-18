"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  type RemoveFeaturedProductInput,
  removeFeaturedProductSchema,
} from "@/actions/admin-showcase/schema";
import { db } from "@/db";
import { featuredProductTable } from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";

type FeaturedProductActionResult = {
  success: boolean;
  message: string;
};

export async function removeAdminFeaturedProduct(
  input: RemoveFeaturedProductInput,
): Promise<FeaturedProductActionResult> {
  const payload = removeFeaturedProductSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message:
        payload.error.issues[0]?.message ?? "Item destacado inválido.",
    };
  }

  await requireSuperAdminSessionOrThrow();

  const existingItem = await db.query.featuredProductTable.findFirst({
    where: eq(featuredProductTable.id, payload.data.featuredProductId),
  });

  if (!existingItem) {
    return {
      success: false,
      message: "Item destacado não encontrado.",
    };
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(featuredProductTable)
      .where(eq(featuredProductTable.id, existingItem.id));

    const remainingItems = await tx.query.featuredProductTable.findMany({
      orderBy: [asc(featuredProductTable.position)],
    });

    for (const [index, item] of remainingItems.entries()) {
      await tx
        .update(featuredProductTable)
        .set({ position: index })
        .where(eq(featuredProductTable.id, item.id));
    }
  });

  revalidatePath("/");
  revalidatePath("/admin/vitrine/mais-vendidos");

  return {
    success: true,
    message: "Produto removido da curadoria manual.",
  };
}
