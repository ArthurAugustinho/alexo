"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { categoryTable, productTable } from "@/db/schema";
import { isSuperAdminRole, requireAdminSession } from "@/lib/admin-auth";

import {
  type DeleteAdminCategoryInput,
  deleteAdminCategorySchema,
} from "../admin-category/schema";

type DeleteAdminCategoryResult = {
  success: boolean;
  message: string;
};

export async function deleteAdminCategory(
  input: DeleteAdminCategoryInput,
): Promise<DeleteAdminCategoryResult> {
  const payload = deleteAdminCategorySchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Categoria inválida.",
    };
  }

  const { role } = await requireAdminSession();

  if (!isSuperAdminRole(role)) {
    return {
      success: false,
      message: "Apenas o super admin pode excluir categorias.",
    };
  }

  const existingCategory = await db.query.categoryTable.findFirst({
    where: eq(categoryTable.id, payload.data.categoryId),
  });

  if (!existingCategory) {
    return {
      success: false,
      message: "Categoria não encontrada.",
    };
  }

  const linkedProduct = await db.query.productTable.findFirst({
    where: eq(productTable.categoryId, existingCategory.id),
  });

  if (linkedProduct) {
    return {
      success: false,
      message:
        "Esta categoria não pode ser excluída porque ainda possui produtos vinculados.",
    };
  }

  await db.delete(categoryTable).where(eq(categoryTable.id, existingCategory.id));

  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/category/${existingCategory.slug}`);

  return {
    success: true,
    message: "Categoria excluída com sucesso.",
  };
}
