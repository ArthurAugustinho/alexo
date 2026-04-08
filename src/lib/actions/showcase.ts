"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  featuredProductTable,
  productTable,
  seasonalBannerTable,
} from "@/db/schema";
import { requireSuperAdminSessionOrThrow } from "@/lib/admin-auth";
import {
  type AddFeaturedProductInput,
  addFeaturedProductSchema,
  type AdminBannerInput,
  adminBannerSchema,
  type DeleteBannerInput,
  deleteBannerSchema,
  type RemoveFeaturedProductInput,
  removeFeaturedProductSchema,
  type ReorderFeaturedProductsInput,
  reorderFeaturedProductsSchema,
} from "@/lib/showcase-schema";

type ActionResult = { success: boolean; message: string };

export async function createAdminBanner(
  input: AdminBannerInput,
): Promise<ActionResult> {
  const payload = adminBannerSchema.safeParse(input);
  if (!payload.success)
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };

  if (payload.data.startDate >= payload.data.endDate)
    return {
      success: false,
      message: "A data final precisa ser posterior à data inicial.",
    };

  await requireSuperAdminSessionOrThrow();

  const now = new Date();
  await db.insert(seasonalBannerTable).values({
    imageUrl: payload.data.imageUrl,
    mobileImageUrl: payload.data.mobileImageUrl || null,
    title: payload.data.title,
    subtitle: payload.data.subtitle,
    linkUrl: payload.data.linkUrl,
    startDate: payload.data.startDate,
    endDate: payload.data.endDate,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/");
  revalidatePath("/admin/vitrine/banners");

  return { success: true, message: "Banner criado com sucesso." };
}

export async function updateAdminBanner(
  input: AdminBannerInput,
): Promise<ActionResult> {
  const payload = adminBannerSchema.safeParse(input);
  if (!payload.success)
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Dados inválidos.",
    };

  if (!payload.data.bannerId)
    return { success: false, message: "Banner inválido." };

  if (payload.data.startDate >= payload.data.endDate)
    return {
      success: false,
      message: "A data final precisa ser posterior à data inicial.",
    };

  await requireSuperAdminSessionOrThrow();

  const existingBanner = await db.query.seasonalBannerTable.findFirst({
    where: eq(seasonalBannerTable.id, payload.data.bannerId),
  });
  if (!existingBanner)
    return { success: false, message: "Banner não encontrado." };

  await db
    .update(seasonalBannerTable)
    .set({
      imageUrl: payload.data.imageUrl,
      mobileImageUrl: payload.data.mobileImageUrl || null,
      title: payload.data.title,
      subtitle: payload.data.subtitle,
      linkUrl: payload.data.linkUrl,
      startDate: payload.data.startDate,
      endDate: payload.data.endDate,
      updatedAt: new Date(),
    })
    .where(eq(seasonalBannerTable.id, existingBanner.id));

  revalidatePath("/");
  revalidatePath("/admin/vitrine/banners");

  return { success: true, message: "Banner atualizado com sucesso." };
}

export async function deleteAdminBanner(
  input: DeleteBannerInput,
): Promise<ActionResult> {
  const payload = deleteBannerSchema.safeParse(input);
  if (!payload.success)
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Banner inválido.",
    };

  await requireSuperAdminSessionOrThrow();

  const existingBanner = await db.query.seasonalBannerTable.findFirst({
    where: eq(seasonalBannerTable.id, payload.data.bannerId),
  });
  if (!existingBanner)
    return { success: false, message: "Banner não encontrado." };

  await db
    .delete(seasonalBannerTable)
    .where(eq(seasonalBannerTable.id, existingBanner.id));

  revalidatePath("/");
  revalidatePath("/admin/vitrine/banners");

  return { success: true, message: "Banner excluído com sucesso." };
}

export async function addAdminFeaturedProduct(
  input: AddFeaturedProductInput,
): Promise<ActionResult> {
  const payload = addFeaturedProductSchema.safeParse(input);
  if (!payload.success)
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Produto inválido.",
    };

  await requireSuperAdminSessionOrThrow();

  const existingProduct = await db.query.productTable.findFirst({
    where: eq(productTable.id, payload.data.productId),
  });
  if (!existingProduct)
    return { success: false, message: "Produto não encontrado." };

  const featuredProducts = await db.query.featuredProductTable.findMany({
    orderBy: [asc(featuredProductTable.position)],
  });

  if (featuredProducts.some((item) => item.productId === payload.data.productId))
    return {
      success: false,
      message: "Esse produto já está na lista de destaque.",
    };

  if (featuredProducts.length >= 10)
    return {
      success: false,
      message: "A lista de destaque aceita no máximo 10 produtos.",
    };

  await db.insert(featuredProductTable).values({
    productId: payload.data.productId,
    position: featuredProducts.length,
  });

  revalidatePath("/");
  revalidatePath("/admin/vitrine/mais-vendidos");

  return { success: true, message: "Produto adicionado à curadoria manual." };
}

export async function removeAdminFeaturedProduct(
  input: RemoveFeaturedProductInput,
): Promise<ActionResult> {
  const payload = removeFeaturedProductSchema.safeParse(input);
  if (!payload.success)
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Item destacado inválido.",
    };

  await requireSuperAdminSessionOrThrow();

  const existingItem = await db.query.featuredProductTable.findFirst({
    where: eq(featuredProductTable.id, payload.data.featuredProductId),
  });
  if (!existingItem)
    return { success: false, message: "Item destacado não encontrado." };

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

  return { success: true, message: "Produto removido da curadoria manual." };
}

export async function reorderAdminFeaturedProducts(
  input: ReorderFeaturedProductsInput,
): Promise<ActionResult> {
  const payload = reorderFeaturedProductsSchema.safeParse(input);
  if (!payload.success)
    return {
      success: false,
      message: payload.error.issues[0]?.message ?? "Ordenação inválida.",
    };

  await requireSuperAdminSessionOrThrow();

  const uniqueIds = new Set(payload.data.items.map((item) => item.id));
  if (uniqueIds.size !== payload.data.items.length)
    return {
      success: false,
      message: "A ordenação contém itens duplicados.",
    };

  const existingItems = await db.query.featuredProductTable.findMany();
  if (existingItems.length !== payload.data.items.length)
    return {
      success: false,
      message:
        "A lista de destaque mudou. Atualize a página e tente novamente.",
    };

  const existingIds = new Set(existingItems.map((item) => item.id));
  if (payload.data.items.some((item) => !existingIds.has(item.id)))
    return {
      success: false,
      message: "A lista de destaque contém itens inválidos.",
    };

  await db.transaction(async (tx) => {
    for (const item of payload.data.items) {
      await tx
        .update(featuredProductTable)
        .set({ position: item.position })
        .where(eq(featuredProductTable.id, item.id));
    }
  });

  revalidatePath("/");
  revalidatePath("/admin/vitrine/mais-vendidos");

  return { success: true, message: "Ordem da vitrine atualizada com sucesso." };
}
