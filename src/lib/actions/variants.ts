"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { productTable, productVariantTable } from "@/db/schema";
import { requireAdminSession } from "@/lib/admin-auth";
import { generateSlug } from "@/lib/slug";

import {
  type CreateVariantInput,
  createVariantSchema,
  type DeleteVariantInput,
  deleteVariantSchema,
  type ToggleVariantAvailabilityInput,
  toggleVariantAvailabilitySchema,
  type UpdateVariantInput,
  updateVariantSchema,
} from "../admin-variant-schema";

type VariantActionResult = {
  success: boolean;
  message: string;
};

function getValidationErrorMessage(
  issues: { message: string }[] | undefined,
  fallbackMessage: string,
) {
  return issues?.[0]?.message ?? fallbackMessage;
}

function hasVariantConflict(
  variants: (typeof productVariantTable.$inferSelect)[],
  color: string,
  size: (typeof productVariantTable.$inferSelect)["size"],
  excludeVariantId?: string,
) {
  const normalizedColor = color.trim().toLowerCase();

  return variants.some(
    (variant) =>
      variant.id !== excludeVariantId &&
      variant.size === size &&
      variant.color.trim().toLowerCase() === normalizedColor,
  );
}

function buildVariantSlugLabel(
  productName: string,
  color: string,
  size: (typeof productVariantTable.$inferSelect)["size"],
) {
  return generateSlug(`${productName}-${color}-${size}`) || "variacao";
}

async function getUniqueVariantSlug(
  baseLabel: string,
  excludeVariantId?: string,
) {
  let attempt = 0;

  while (true) {
    const candidate =
      attempt === 0 ? baseLabel : `${baseLabel}-${String(attempt + 1)}`;
    const existingVariant = await db.query.productVariantTable.findFirst({
      where: eq(productVariantTable.slug, candidate),
    });

    if (!existingVariant || existingVariant.id === excludeVariantId) {
      return candidate;
    }

    attempt += 1;
  }
}

function revalidateVariantPaths(params: {
  productId: string;
  productSlug: string;
}) {
  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/admin/produtos/${params.productId}/variantes`);
  revalidatePath(`/product/${params.productSlug}`);
}

export async function toggleAvailability(
  input: ToggleVariantAvailabilityInput,
): Promise<VariantActionResult> {
  const payload = toggleVariantAvailabilitySchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: getValidationErrorMessage(
        payload.error.issues,
        "Variante inválida.",
      ),
    };
  }

  await requireAdminSession();

  const existingVariant = await db.query.productVariantTable.findFirst({
    where: eq(productVariantTable.id, payload.data.variantId),
    with: {
      product: true,
    },
  });

  if (!existingVariant) {
    return {
      success: false,
      message: "Variante não encontrada.",
    };
  }

  await db
    .update(productVariantTable)
    .set({
      isAvailable: payload.data.isAvailable,
    })
    .where(eq(productVariantTable.id, existingVariant.id));

  revalidateVariantPaths({
    productId: existingVariant.productId,
    productSlug: existingVariant.product.slug,
  });

  return {
    success: true,
    message: payload.data.isAvailable
      ? "Variante marcada como disponível."
      : "Variante marcada como indisponível.",
  };
}

export async function createVariant(
  input: CreateVariantInput,
): Promise<VariantActionResult> {
  const payload = createVariantSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: getValidationErrorMessage(
        payload.error.issues,
        "Dados da variante inválidos.",
      ),
    };
  }

  await requireAdminSession();

  const product = await db.query.productTable.findFirst({
    where: eq(productTable.id, payload.data.productId),
    with: {
      variants: {
        orderBy: [asc(productVariantTable.createdAt)],
      },
    },
  });

  if (!product) {
    return {
      success: false,
      message: "Produto não encontrado.",
    };
  }

  if (hasVariantConflict(product.variants, payload.data.color, payload.data.size)) {
    return {
      success: false,
      message: "Já existe uma variante com essa combinação de cor e tamanho.",
    };
  }

  const baseVariant = product.variants[0];

  if (!baseVariant) {
    return {
      success: false,
      message: "O produto precisa ter uma variante base para herdar o preço.",
    };
  }

  const variantSlug = await getUniqueVariantSlug(
    buildVariantSlugLabel(product.name, payload.data.color, payload.data.size),
  );

  await db.insert(productVariantTable).values({
    productId: product.id,
    name: payload.data.color,
    slug: variantSlug,
    color: payload.data.color,
    size: payload.data.size,
    imageUrl: payload.data.imageUrl,
    priceInCents: baseVariant.priceInCents,
    isAvailable: payload.data.isAvailable,
  });

  revalidateVariantPaths({
    productId: product.id,
    productSlug: product.slug,
  });

  return {
    success: true,
    message: "Variante criada com sucesso.",
  };
}

export async function updateVariant(
  input: UpdateVariantInput,
): Promise<VariantActionResult> {
  const payload = updateVariantSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: getValidationErrorMessage(
        payload.error.issues,
        "Dados da variante inválidos.",
      ),
    };
  }

  await requireAdminSession();

  const existingVariant = await db.query.productVariantTable.findFirst({
    where: eq(productVariantTable.id, payload.data.variantId),
    with: {
      product: {
        with: {
          variants: {
            orderBy: [asc(productVariantTable.createdAt)],
          },
        },
      },
    },
  });

  if (!existingVariant) {
    return {
      success: false,
      message: "Variante não encontrada.",
    };
  }

  if (payload.data.productId !== existingVariant.productId) {
    return {
      success: false,
      message: "Produto inválido para esta variante.",
    };
  }

  if (
    hasVariantConflict(
      existingVariant.product.variants,
      payload.data.color,
      payload.data.size,
      existingVariant.id,
    )
  ) {
    return {
      success: false,
      message: "Já existe uma variante com essa combinação de cor e tamanho.",
    };
  }

  const nextSlug =
    existingVariant.color === payload.data.color &&
    existingVariant.size === payload.data.size
      ? existingVariant.slug
      : await getUniqueVariantSlug(
          buildVariantSlugLabel(
            existingVariant.product.name,
            payload.data.color,
            payload.data.size,
          ),
          existingVariant.id,
        );

  await db
    .update(productVariantTable)
    .set({
      color: payload.data.color,
      size: payload.data.size,
      imageUrl: payload.data.imageUrl,
      isAvailable: payload.data.isAvailable,
      slug: nextSlug,
    })
    .where(eq(productVariantTable.id, existingVariant.id));

  revalidateVariantPaths({
    productId: existingVariant.productId,
    productSlug: existingVariant.product.slug,
  });

  return {
    success: true,
    message: "Variante atualizada com sucesso.",
  };
}

export async function deleteVariant(
  input: DeleteVariantInput,
): Promise<VariantActionResult> {
  const payload = deleteVariantSchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: getValidationErrorMessage(
        payload.error.issues,
        "Variante inválida.",
      ),
    };
  }

  await requireAdminSession();

  const existingVariant = await db.query.productVariantTable.findFirst({
    where: eq(productVariantTable.id, payload.data.variantId),
    with: {
      product: {
        with: {
          variants: {
            orderBy: [asc(productVariantTable.createdAt)],
          },
        },
      },
    },
  });

  if (!existingVariant) {
    return {
      success: false,
      message: "Variante não encontrada.",
    };
  }

  if (existingVariant.product.variants.length <= 1) {
    return {
      success: false,
      message: "O produto precisa manter ao menos uma variante cadastrada.",
    };
  }

  try {
    await db
      .delete(productVariantTable)
      .where(eq(productVariantTable.id, existingVariant.id));
  } catch {
    return {
      success: false,
      message:
        "Esta variante não pode ser excluída porque já possui pedidos vinculados.",
    };
  }

  revalidateVariantPaths({
    productId: existingVariant.productId,
    productSlug: existingVariant.product.slug,
  });

  return {
    success: true,
    message: "Variante excluída com sucesso.",
  };
}
