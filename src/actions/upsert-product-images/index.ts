"use server";

import { eq, inArray, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { productImageTable, productTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type UpsertProductImagesInput,
  upsertProductImagesSchema,
} from "./schema";

type UpsertProductImagesResult = {
  success: boolean;
  message: string;
};

export async function upsertProductImages(
  input: UpsertProductImagesInput,
): Promise<UpsertProductImagesResult> {
  const payload = upsertProductImagesSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireAdminSessionOrThrow();

  const existingProduct = await db.query.productTable.findFirst({
    where: eq(productTable.id, payload.data.productId),
    columns: { id: true, slug: true },
  });

  if (!existingProduct) {
    return { success: false, message: "Produto não encontrado." };
  }

  const incomingIds = payload.data.images
    .map((img) => img.id)
    .filter((id): id is string => Boolean(id));

  await db.transaction(async (tx) => {
    // Remove images not present in the incoming list
    if (incomingIds.length > 0) {
      await tx
        .delete(productImageTable)
        .where(
          eq(productImageTable.productId, payload.data.productId) &&
            notInArray(productImageTable.id, incomingIds),
        );
    } else {
      await tx
        .delete(productImageTable)
        .where(eq(productImageTable.productId, payload.data.productId));
    }

    for (const img of payload.data.images) {
      if (img.id) {
        await tx
          .update(productImageTable)
          .set({
            url: img.url,
            alt: img.alt ?? null,
            position: img.position,
          })
          .where(
            eq(productImageTable.id, img.id) &&
              eq(productImageTable.productId, payload.data.productId),
          );
      } else {
        await tx.insert(productImageTable).values({
          productId: payload.data.productId,
          url: img.url,
          alt: img.alt ?? null,
          position: img.position,
        });
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/product/${existingProduct.slug}`);

  return { success: true, message: "Imagens salvas com sucesso." };
}
