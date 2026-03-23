import { z } from "zod";

import {
  NUMERIC_PRODUCT_SIZE_VALUES,
  PRODUCT_VARIANT_SIZE_VALUES,
} from "@/lib/product-variant-schema";

export const SIZE_CHART_SIZE_OPTIONS = [
  ...PRODUCT_VARIANT_SIZE_VALUES,
  ...NUMERIC_PRODUCT_SIZE_VALUES,
] as const;

export const SIZE_CHART_MEASUREMENT_FIELDS = [
  {
    key: "bust",
    label: "Busto",
    minField: "bustMin",
    maxField: "bustMax",
    unit: "cm",
  },
  {
    key: "waist",
    label: "Cintura",
    minField: "waistMin",
    maxField: "waistMax",
    unit: "cm",
  },
  {
    key: "hip",
    label: "Quadril",
    minField: "hipMin",
    maxField: "hipMax",
    unit: "cm",
  },
  {
    key: "height",
    label: "Altura",
    minField: "heightMin",
    maxField: "heightMax",
    unit: "cm",
  },
  {
    key: "weight",
    label: "Peso",
    minField: "weightMin",
    maxField: "weightMax",
    unit: "kg",
  },
] as const;

const sizeLabelSchema = z
  .string("Tamanho invalido.")
  .trim()
  .min(1, "Selecione um tamanho.")
  .max(10, "O tamanho pode ter no maximo 10 caracteres.")
  .refine(
    (value) => SIZE_CHART_SIZE_OPTIONS.includes(value as (typeof SIZE_CHART_SIZE_OPTIONS)[number]),
    "Selecione um tamanho valido.",
  );

const optionalMeasurementSchema = z
  .number("Informe um numero valido.")
  .positive("Informe um valor maior que zero.")
  .optional();

const measurementRangeShape = {
  bustMin: z.number().positive().nullable(),
  bustMax: z.number().positive().nullable(),
  waistMin: z.number().positive().nullable(),
  waistMax: z.number().positive().nullable(),
  hipMin: z.number().positive().nullable(),
  hipMax: z.number().positive().nullable(),
  heightMin: z.number().positive().nullable(),
  heightMax: z.number().positive().nullable(),
  weightMin: z.number().positive().nullable(),
  weightMax: z.number().positive().nullable(),
} as const;

function validateMeasurementRanges(
  value: Record<string, number | string | null | undefined>,
  ctx: z.RefinementCtx,
) {
  for (const field of SIZE_CHART_MEASUREMENT_FIELDS) {
    const minValue = value[field.minField];
    const maxValue = value[field.maxField];

    if (
      typeof minValue === "number" &&
      typeof maxValue === "number" &&
      minValue >= maxValue
    ) {
      ctx.addIssue({
        code: "custom",
        message: "O valor minimo deve ser menor que o maximo.",
        path: [field.maxField],
      });
    }
  }
}

export const sizeChartRangeSchema = z.object({
  sizeLabel: sizeLabelSchema,
  ...measurementRangeShape,
  position: z.number().int().nonnegative(),
});

export const sizeChartEntrySchema = sizeChartRangeSchema.extend({
  id: z.uuid(),
  categoryId: z.uuid(),
  createdAt: z.date(),
});

const sizeChartFormBaseSchema = z
  .object({
    sizeLabel: sizeLabelSchema,
    bustMin: optionalMeasurementSchema,
    bustMax: optionalMeasurementSchema,
    waistMin: optionalMeasurementSchema,
    waistMax: optionalMeasurementSchema,
    hipMin: optionalMeasurementSchema,
    hipMax: optionalMeasurementSchema,
    heightMin: optionalMeasurementSchema,
    heightMax: optionalMeasurementSchema,
    weightMin: optionalMeasurementSchema,
    weightMax: optionalMeasurementSchema,
  })
  .superRefine(validateMeasurementRanges);

export const createSizeChartEntrySchema = sizeChartFormBaseSchema.extend({
  categoryId: z.uuid("Categoria invalida."),
});

export const updateSizeChartEntrySchema = sizeChartFormBaseSchema.extend({
  entryId: z.uuid("Linha de medidas invalida."),
  categoryId: z.uuid("Categoria invalida."),
});

export const deleteSizeChartEntrySchema = z.object({
  entryId: z.uuid("Linha de medidas invalida."),
  categoryId: z.uuid("Categoria invalida."),
});

export const userMeasurementsSchema = z.object({
  bust: optionalMeasurementSchema,
  waist: optionalMeasurementSchema,
  hip: optionalMeasurementSchema,
  height: optionalMeasurementSchema,
  weight: optionalMeasurementSchema,
});

export const sizeChartEntryListSchema = z.array(sizeChartEntrySchema);
export const USER_MEASUREMENTS_STORAGE_KEY = "user_measurements";

export const DEFAULT_BRAZILIAN_SIZE_CHART: SizeChartRange[] = [
  {
    sizeLabel: "PP",
    bustMin: 78,
    bustMax: 82,
    waistMin: 60,
    waistMax: 64,
    hipMin: 86,
    hipMax: 90,
    heightMin: null,
    heightMax: null,
    weightMin: null,
    weightMax: null,
    position: 0,
  },
  {
    sizeLabel: "P",
    bustMin: 83,
    bustMax: 89,
    waistMin: 65,
    waistMax: 71,
    hipMin: 91,
    hipMax: 97,
    heightMin: null,
    heightMax: null,
    weightMin: null,
    weightMax: null,
    position: 1,
  },
  {
    sizeLabel: "M",
    bustMin: 90,
    bustMax: 96,
    waistMin: 72,
    waistMax: 78,
    hipMin: 98,
    hipMax: 104,
    heightMin: null,
    heightMax: null,
    weightMin: null,
    weightMax: null,
    position: 2,
  },
  {
    sizeLabel: "G",
    bustMin: 97,
    bustMax: 103,
    waistMin: 79,
    waistMax: 85,
    hipMin: 105,
    hipMax: 111,
    heightMin: null,
    heightMax: null,
    weightMin: null,
    weightMax: null,
    position: 3,
  },
  {
    sizeLabel: "GG",
    bustMin: 104,
    bustMax: 112,
    waistMin: 86,
    waistMax: 94,
    hipMin: 112,
    hipMax: 120,
    heightMin: null,
    heightMax: null,
    weightMin: null,
    weightMax: null,
    position: 4,
  },
  {
    sizeLabel: "GGG",
    bustMin: 113,
    bustMax: 121,
    waistMin: 95,
    waistMax: 103,
    hipMin: 121,
    hipMax: 129,
    heightMin: null,
    heightMax: null,
    weightMin: null,
    weightMax: null,
    position: 5,
  },
];

export type SizeChartRange = z.infer<typeof sizeChartRangeSchema>;
export type SizeChartEntry = z.infer<typeof sizeChartEntrySchema>;
export type CreateSizeChartEntryInput = z.infer<typeof createSizeChartEntrySchema>;
export type UpdateSizeChartEntryInput = z.infer<typeof updateSizeChartEntrySchema>;
export type DeleteSizeChartEntryInput = z.infer<typeof deleteSizeChartEntrySchema>;
export type UserMeasurements = z.infer<typeof userMeasurementsSchema>;
