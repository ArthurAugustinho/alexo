"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { categoryTable, productTable } from "@/db/schema";
import { isSuperAdminRole, requireAdminSession } from "@/lib/admin-auth";
import {
  type AdminCategoryInput,
  adminCategorySchema,
  type DeleteAdminCategoryInput,
  deleteAdminCategorySchema,
} from "@/lib/admin-category-schema";
import { generateSlug } from "@/lib/slug";

type ActionResult = { success: boolean; message: string };

async function getUniqueCategorySlug(name: string, excludeCategoryId?: string) {
  const baseSlug = generateSlug(name) || "categoria";
  let attempt = 0;

  while (true) {
    const candidate =
      attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const existingCategory = await db.query.categoryTable.findFirst({
      where: eq(categoryTable.slug, candidate),
    });

    if (!existingCategory || existingCategory.id === excludeCategoryId)
      return candidate;

    attempt += 1;
  }
}

export async function createAdminCategory(
  input: AdminCategoryInput,
): Promise<ActionResult> {
  const payload = adminCategorySchema.safeParse(input);
  if (!payload.success)
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };

  await requireAdminSession();

  const slug = await getUniqueCategorySlug(payload.data.name);
  await db.insert(categoryTable).values({ name: payload.data.name, slug });

  revalidatePath("/");
  revalidatePath("/admin/dashboard");

  return { success: true, message: "Categoria criada com sucesso." };
}

export async function updateAdminCategory(
  input: AdminCategoryInput,
): Promise<ActionResult> {
  const payload = adminCategorySchema.safeParse(input);
  if (!payload.success)
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };

  if (!payload.data.categoryId)
    return { success: false, message: "Categoria inválida." };

  await requireAdminSession();

  const existingCategory = await db.query.categoryTable.findFirst({
    where: eq(categoryTable.id, payload.data.categoryId),
  });
  if (!existingCategory)
    return { success: false, message: "Categoria não encontrada." };

  const slug =
    existingCategory.name === payload.data.name
      ? existingCategory.slug
      : await getUniqueCategorySlug(payload.data.name, existingCategory.id);

  await db
    .update(categoryTable)
    .set({ name: payload.data.name, slug })
    .where(eq(categoryTable.id, existingCategory.id));

  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/category/${existingCategory.slug}`);
  revalidatePath(`/category/${slug}`);

  return { success: true, message: "Categoria atualizada com sucesso." };
}

export async function deleteAdminCategory(
  input: DeleteAdminCategoryInput,
): Promise<ActionResult> {
  const payload = deleteAdminCategorySchema.safeParse(input);
  if (!payload.success)
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Categoria inválida.",
    };

  const { role } = await requireAdminSession();
  if (!isSuperAdminRole(role))
    return {
      success: false,
      message: "Apenas o super admin pode excluir categorias.",
    };

  const existingCategory = await db.query.categoryTable.findFirst({
    where: eq(categoryTable.id, payload.data.categoryId),
  });
  if (!existingCategory)
    return { success: false, message: "Categoria não encontrada." };

  const linkedProduct = await db.query.productTable.findFirst({
    where: eq(productTable.categoryId, existingCategory.id),
  });
  if (linkedProduct)
    return {
      success: false,
      message:
        "Esta categoria não pode ser excluída porque ainda possui produtos vinculados.",
    };

  await db
    .delete(categoryTable)
    .where(eq(categoryTable.id, existingCategory.id));

  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/category/${existingCategory.slug}`);

  return { success: true, message: "Categoria excluída com sucesso." };
}
