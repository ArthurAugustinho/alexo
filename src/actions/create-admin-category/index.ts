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

async function getUniqueCategorySlug(name: string) {
  const baseSlug = generateSlug(name) || "categoria";
  let attempt = 0;

  while (true) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const existingCategory = await db.query.categoryTable.findFirst({
      where: eq(categoryTable.slug, candidate),
    });

    if (!existingCategory) {
      return candidate;
    }

    attempt += 1;
  }
}

export async function createAdminCategory(
  input: AdminCategoryInput,
): Promise<AdminCategoryActionResult> {
  const payload = adminCategorySchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  await requireAdminSession();

  const slug = await getUniqueCategorySlug(payload.data.name);

  await db.insert(categoryTable).values({
    name: payload.data.name,
    slug,
  });

  revalidatePath("/");
  revalidatePath("/admin/dashboard");

  return {
    success: true,
    message: "Categoria criada com sucesso.",
  };
}
