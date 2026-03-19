import { z } from "zod";

import { productVariantSizeSchema } from "./product-variant-schema";

export const adminVariantSchema = z.object({
  productId: z.uuid("Produto invalido."),
  color: z
    .string("Cor invalida.")
    .trim()
    .min(1, "Informe a cor da variante."),
  size: productVariantSizeSchema,
  imageUrl: z.url("Informe uma URL de imagem valida."),
  stock: z.coerce
    .number("Estoque invalido.")
    .int("Informe um estoque inteiro.")
    .min(0, "O estoque nao pode ser negativo."),
});

export const createVariantSchema = adminVariantSchema;

export const updateVariantSchema = adminVariantSchema.extend({
  variantId: z.uuid("Variante invalida."),
});

export const updateVariantStockSchema = z.object({
  variantId: z.uuid("Variante invalida."),
  stock: z.coerce
    .number("Estoque invalido.")
    .int("Informe um estoque inteiro.")
    .min(0, "O estoque nao pode ser negativo."),
});

export const deleteVariantSchema = z.object({
  variantId: z.uuid("Variante invalida."),
});

export type AdminVariantFormValues = z.input<typeof adminVariantSchema>;
export type AdminVariantInput = z.infer<typeof adminVariantSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type UpdateVariantStockInput = z.infer<typeof updateVariantStockSchema>;
export type DeleteVariantInput = z.infer<typeof deleteVariantSchema>;
