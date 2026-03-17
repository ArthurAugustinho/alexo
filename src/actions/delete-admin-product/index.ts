"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { productTable } from "@/db/schema";
import { isSuperAdminRole, requireAdminSession } from "@/lib/admin-auth";

import {
  type DeleteAdminProductInput,
  deleteAdminProductSchema,
} from "../admin-product/schema";

type DeleteAdminProductResult = {
  success: boolean;
  message: string;
};

export async function deleteAdminProduct(
  input: DeleteAdminProductInput,
): Promise<DeleteAdminProductResult> {
  const payload = deleteAdminProductSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Produto inv\u00e1lido.",
    };
  }

  const { role } = await requireAdminSession();

  if (!isSuperAdminRole(role)) {
    return {
      success: false,
      message: "Apenas o super admin pode excluir produtos.",
    };
  }

  try {
    await db
      .delete(productTable)
      .where(eq(productTable.id, payload.data.productId));

    revalidatePath("/");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: "Produto exclu\u00eddo com sucesso.",
    };
  } catch {
    // Produtos j\u00e1 presentes em pedidos n\u00e3o podem ser removidos por causa
    // das chaves estrangeiras das variantes. Nessa situa\u00e7\u00e3o, mantemos a
    // opera\u00e7\u00e3o segura e devolvemos uma mensagem mais objetiva para o painel.
    return {
      success: false,
      message:
        "Este produto n\u00e3o pode ser exclu\u00eddo porque j\u00e1 possui pedidos vinculados.",
    };
  }
}
