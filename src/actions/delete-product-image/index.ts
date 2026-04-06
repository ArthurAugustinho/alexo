"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { productImageTable } from "@/db/schema";
import { requireAdminSessionOrThrow } from "@/lib/admin-auth";

import {
  type DeleteProductImageInput,
  deleteProductImageSchema,
} from "./schema";

type DeleteProductImageResult = {
  success: boolean;
  message: string;
};

export async function deleteProductImage(
  input: DeleteProductImageInput,
): Promise<DeleteProductImageResult> {
  const payload = deleteProductImageSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireAdminSessionOrThrow();

  await db
    .delete(productImageTable)
    .where(eq(productImageTable.id, payload.data.imageId));

  revalidatePath("/");
  revalidatePath("/admin/dashboard");

  return { success: true, message: "Imagem removida." };
}
