"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireAdminSessionOrThrow } from "@/lib/admin-auth";
import type { ImportProductsApiResponse, ImportError } from "@/app/api/admin/import-products/route";

import { importProductsFileSchema } from "./schema";

type ImportProductsSuccess = {
  success: true;
  imported: number;
  errors: ImportError[];
};

type ImportProductsFailure = {
  success: false;
  message: string;
};

type ImportProductsResult = ImportProductsSuccess | ImportProductsFailure;

export async function importProducts(
  formData: FormData,
): Promise<ImportProductsResult> {
  await requireAdminSessionOrThrow();

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { success: false, message: "Arquivo não encontrado no formulário." };
  }

  const parsed = importProductsFileSchema.safeParse(file);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Arquivo inválido.",
    };
  }

  // Forward cookies so the API route can verify the session
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/admin/import-products`, {
      method: "POST",
      headers: { Cookie: cookieHeader },
      body: formData,
    });
  } catch {
    return {
      success: false,
      message: "Não foi possível conectar ao servidor. Tente novamente.",
    };
  }

  const data = (await response.json()) as
    | ImportProductsApiResponse
    | { error: string };

  if (!response.ok) {
    return {
      success: false,
      message:
        "error" in data ? data.error : "Erro ao processar a importação.",
    };
  }

  revalidatePath("/admin/produtos");
  revalidatePath("/admin/dashboard");

  return data as ImportProductsSuccess;
}
