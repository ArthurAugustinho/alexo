import { z } from "zod";

import {
  productSizeTypeSchema,
  productVariantSizeSchema,
} from "./product-variant-schema";

const adminProductVariantStockSchema = z.object({
  variantId: z.uuid("Variante invalida.").nullable(),
  color: z
    .string("Cor invalida.")
    .trim()
    .min(1, "Informe a cor da variante."),
  size: productVariantSizeSchema,
  stock: z.coerce
    .number("Estoque invalido.")
    .int("Informe um estoque inteiro.")
    .min(0, "O estoque nao pode ser negativo."),
  imageUrl: z.url("Informe uma URL de imagem valida."),
});

export const adminProductSchema = z
  .object({
    productId: z.uuid().optional(),
    primaryVariantId: z.uuid().optional(),
    name: z
      .string("Nome invalido.")
      .trim()
      .min(2, "Informe o nome do produto."),
    brand: z
      .string("Marca invalida.")
      .trim()
      .max(100, "A marca pode ter no maximo 100 caracteres.")
      .default(""),
    description: z
      .string("Descricao invalida.")
      .trim()
      .min(10, "A descricao precisa ter pelo menos 10 caracteres."),
    categoryId: z.uuid("Categoria invalida."),
    variantName: z
      .string("Nome da variacao invalido.")
      .trim()
      .min(1, "Informe o nome da variacao."),
    variantColor: z
      .string("Cor invalida.")
      .trim()
      .min(1, "Informe a cor da variacao."),
    variantStock: z.coerce
      .number("Estoque invalido.")
      .int("Informe um estoque inteiro.")
      .min(0, "O estoque nao pode ser negativo."),
    priceInReais: z.coerce
      .number("Preco invalido.")
      .positive("O preco precisa ser maior que zero."),
    shippingCostInReais: z.coerce
      .number("Frete invalido.")
      .min(0, "O frete nao pode ser negativo."),
    imageUrl: z.url("Informe uma URL de imagem valida."),
    sizeType: productSizeTypeSchema,
    productSizes: z.array(productVariantSizeSchema).default([]),
    variantStocks: z.array(adminProductVariantStockSchema).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.sizeType !== "numeric") {
      return;
    }

    if (value.productSizes.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Selecione ao menos um tamanho numerico.",
        path: ["productSizes"],
      });
    }
  });

export const deleteAdminProductSchema = z.object({
  productId: z.uuid("Produto invalido."),
});

export type AdminProductFormValues = z.input<typeof adminProductSchema>;
export type AdminProductInput = z.infer<typeof adminProductSchema>;
export type DeleteAdminProductInput = z.infer<typeof deleteAdminProductSchema>;
