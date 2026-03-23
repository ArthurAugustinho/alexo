"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { categoryTable, sizeChartTable } from "@/db/schema";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  type CreateSizeChartEntryInput,
  createSizeChartEntrySchema,
  type DeleteSizeChartEntryInput,
  deleteSizeChartEntrySchema,
  SIZE_CHART_SIZE_OPTIONS,
  type UpdateSizeChartEntryInput,
  updateSizeChartEntrySchema,
} from "@/lib/size-chart-schema";

type SizeChartActionResult = {
  success: boolean;
  message: string;
};

function getValidationErrorMessage(
  issues: { message: string }[] | undefined,
  fallbackMessage: string,
) {
  return issues?.[0]?.message ?? fallbackMessage;
}

function getSizeChartPosition(sizeLabel: string) {
  const normalizedSizeLabel = sizeLabel.trim().toUpperCase();
  const optionIndex = SIZE_CHART_SIZE_OPTIONS.findIndex(
    (option) => option === normalizedSizeLabel,
  );

  if (optionIndex >= 0) {
    return optionIndex;
  }

  return SIZE_CHART_SIZE_OPTIONS.length + 1;
}

function revalidateSizeChartPaths(categoryId: string) {
  revalidatePath("/admin/dashboard");
  revalidatePath(`/admin/categorias/${categoryId}/medidas`);
}

export async function createSizeChartEntry(
  input: CreateSizeChartEntryInput,
): Promise<SizeChartActionResult> {
  const payload = createSizeChartEntrySchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: getValidationErrorMessage(
        payload.error.issues,
        "Dados invalidos para a tabela de medidas.",
      ),
    };
  }

  await requireAdminSession();

  const category = await db.query.categoryTable.findFirst({
    where: eq(categoryTable.id, payload.data.categoryId),
  });

  if (!category) {
    return {
      success: false,
      message: "Categoria nao encontrada.",
    };
  }

  const existingEntry = await db.query.sizeChartTable.findFirst({
    where: and(
      eq(sizeChartTable.categoryId, payload.data.categoryId),
      eq(sizeChartTable.sizeLabel, payload.data.sizeLabel),
    ),
  });

  if (existingEntry) {
    return {
      success: false,
      message: "Ja existe uma linha para esse tamanho nessa categoria.",
    };
  }

  await db.insert(sizeChartTable).values({
    categoryId: payload.data.categoryId,
    sizeLabel: payload.data.sizeLabel,
    bustMin: payload.data.bustMin ?? null,
    bustMax: payload.data.bustMax ?? null,
    waistMin: payload.data.waistMin ?? null,
    waistMax: payload.data.waistMax ?? null,
    hipMin: payload.data.hipMin ?? null,
    hipMax: payload.data.hipMax ?? null,
    heightMin: payload.data.heightMin ?? null,
    heightMax: payload.data.heightMax ?? null,
    weightMin: payload.data.weightMin ?? null,
    weightMax: payload.data.weightMax ?? null,
    position: getSizeChartPosition(payload.data.sizeLabel),
  });

  revalidateSizeChartPaths(payload.data.categoryId);

  return {
    success: true,
    message: "Linha de medidas criada com sucesso.",
  };
}

export async function updateSizeChartEntry(
  input: UpdateSizeChartEntryInput,
): Promise<SizeChartActionResult> {
  const payload = updateSizeChartEntrySchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: getValidationErrorMessage(
        payload.error.issues,
        "Dados invalidos para a tabela de medidas.",
      ),
    };
  }

  await requireAdminSession();

  const existingEntry = await db.query.sizeChartTable.findFirst({
    where: eq(sizeChartTable.id, payload.data.entryId),
  });

  if (!existingEntry || existingEntry.categoryId !== payload.data.categoryId) {
    return {
      success: false,
      message: "Linha de medidas nao encontrada.",
    };
  }

  const conflictingEntry = await db.query.sizeChartTable.findFirst({
    where: and(
      eq(sizeChartTable.categoryId, payload.data.categoryId),
      eq(sizeChartTable.sizeLabel, payload.data.sizeLabel),
    ),
  });

  if (conflictingEntry && conflictingEntry.id !== existingEntry.id) {
    return {
      success: false,
      message: "Ja existe uma linha para esse tamanho nessa categoria.",
    };
  }

  await db
    .update(sizeChartTable)
    .set({
      sizeLabel: payload.data.sizeLabel,
      bustMin: payload.data.bustMin ?? null,
      bustMax: payload.data.bustMax ?? null,
      waistMin: payload.data.waistMin ?? null,
      waistMax: payload.data.waistMax ?? null,
      hipMin: payload.data.hipMin ?? null,
      hipMax: payload.data.hipMax ?? null,
      heightMin: payload.data.heightMin ?? null,
      heightMax: payload.data.heightMax ?? null,
      weightMin: payload.data.weightMin ?? null,
      weightMax: payload.data.weightMax ?? null,
      position: getSizeChartPosition(payload.data.sizeLabel),
    })
    .where(eq(sizeChartTable.id, existingEntry.id));

  revalidateSizeChartPaths(payload.data.categoryId);

  return {
    success: true,
    message: "Linha de medidas atualizada com sucesso.",
  };
}

export async function deleteSizeChartEntry(
  input: DeleteSizeChartEntryInput,
): Promise<SizeChartActionResult> {
  const payload = deleteSizeChartEntrySchema.safeParse(input);

  if (!payload.success) {
    return {
      success: false,
      message: getValidationErrorMessage(
        payload.error.issues,
        "Linha de medidas invalida.",
      ),
    };
  }

  await requireAdminSession();

  const existingEntry = await db.query.sizeChartTable.findFirst({
    where: eq(sizeChartTable.id, payload.data.entryId),
  });

  if (!existingEntry || existingEntry.categoryId !== payload.data.categoryId) {
    return {
      success: false,
      message: "Linha de medidas nao encontrada.",
    };
  }

  await db
    .delete(sizeChartTable)
    .where(eq(sizeChartTable.id, payload.data.entryId));

  revalidateSizeChartPaths(payload.data.categoryId);

  return {
    success: true,
    message: "Linha de medidas excluida com sucesso.",
  };
}
