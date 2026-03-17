"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { categoryTable } from "@/db/schema";
import { requireAdminSession } from "@/lib/admin-auth";
import { generateSlug } from "@/lib/slug";

import {
  type AdminCategoryInput,
  adminCategorySchema,
} from "../admin-category/schema";

type AdminCategoryActionResult = {
  success: boolean;
  message: string;
};

async function getUniqueCategorySlug(name: string, excludeCategoryId?: string) {
  const baseSlug = generateSlug(name) || "categoria";
  let attempt = 0;

  while (true) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const existingCategory = await db.query.categoryTable.findFirst({
      where: eq(categoryTable.slug, candidate),
    });

    if (!existingCategory || existingCategory.id === excludeCategoryId) {
      return candidate;
    }

    attempt += 1;
  }
}

export async function updateAdminCategory(
  input: AdminCategoryInput,
): Promise<AdminCategoryActionResult> {
  const payload = adminCategorySchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  if (!payload.data.categoryId) {
    return {
      success: false,
      message: "Categoria inválida.",
    };
  }

  await requireAdminSession();

  const existingCategory = await db.query.categoryTable.findFirst({
    where: eq(categoryTable.id, payload.data.categoryId),
  });

  if (!existingCategory) {
    return {
      success: false,
      message: "Categoria não encontrada.",
    };
  }

  const slug =
    existingCategory.name === payload.data.name
      ? existingCategory.slug
      : await getUniqueCategorySlug(payload.data.name, existingCategory.id);

  await db
    .update(categoryTable)
    .set({
      name: payload.data.name,
      slug,
    })
    .where(eq(categoryTable.id, existingCategory.id));

  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/category/${existingCategory.slug}`);
  revalidatePath(`/category/${slug}`);

  return {
    success: true,
    message: "Categoria atualizada com sucesso.",
  };
}
