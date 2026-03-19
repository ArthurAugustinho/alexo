import { z } from "zod";

import { productVariantSizeSchema } from "./product-variant-schema";

export const adminVariantSchema = z.object({
  productId: z.uuid("Produto inválido."),
  color: z
    .string("Cor inválida.")
    .trim()
    .min(1, "Informe a cor da variante."),
  size: productVariantSizeSchema,
  imageUrl: z.url("Informe uma URL de imagem válida."),
  isAvailable: z.boolean(),
});

export const createVariantSchema = adminVariantSchema;

export const updateVariantSchema = adminVariantSchema.extend({
  variantId: z.uuid("Variante inválida."),
});

export const toggleVariantAvailabilitySchema = z.object({
  variantId: z.uuid("Variante inválida."),
  isAvailable: z.boolean(),
});

export const deleteVariantSchema = z.object({
  variantId: z.uuid("Variante inválida."),
});

export type AdminVariantFormValues = z.input<typeof adminVariantSchema>;
export type AdminVariantInput = z.infer<typeof adminVariantSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type ToggleVariantAvailabilityInput = z.infer<
  typeof toggleVariantAvailabilitySchema
>;
export type DeleteVariantInput = z.infer<typeof deleteVariantSchema>;
