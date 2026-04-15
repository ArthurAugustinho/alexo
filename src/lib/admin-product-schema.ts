import { z } from "zod";

import {
  productSizeTypeSchema,
  productVariantSizeSchema,
} from "./product-variant-schema";

export const adminPatchOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1, "Informe o label do patch.").max(100),
  imageUrl: z.string().url("Informe uma URL de imagem válida."),
  priceInCents: z.number().int().min(0, "O valor não pode ser negativo."),
});

export type AdminPatchOption = z.infer<typeof adminPatchOptionSchema>;

const optionalPositiveIntegerSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    return value;
  },
  z.coerce
    .number("Valor invalido.")
    .int("Informe um numero inteiro.")
    .min(1, "O valor precisa ser maior que zero.")
    .nullable(),
);

const originPostalCodeSchema = z.preprocess(
  (value) => (value === null || value === undefined ? "" : value),
  z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .pipe(
      z.union([
        z.string().regex(/^\d{8}$/, "CEP deve conter 8 digitos"),
        z.literal(""),
      ]),
    )
    .transform((value) => (value === "" ? undefined : value)),
);

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
    originPostalCode: originPostalCodeSchema,
    description: z
      .string("Descricao invalida.")
      .trim()
      .min(10, "A descricao precisa ter pelo menos 10 caracteres."),
    categoryId: z.uuid("Categoria invalida."),
    variantName: z.string().trim().default(""),
    variantColor: z.string().trim().default(""),
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
    weightGrams: optionalPositiveIntegerSchema,
    widthCm: optionalPositiveIntegerSchema,
    heightCm: optionalPositiveIntegerSchema,
    lengthCm: optionalPositiveIntegerSchema,
    deliveryDaysMin: optionalPositiveIntegerSchema,
    deliveryDaysMax: optionalPositiveIntegerSchema,
    images: z
      .array(
        z.object({
          id: z.uuid().optional(),
          // Permite blob: URLs (previews locais antes do upload) e URLs reais
          url: z.string().min(1, "Informe a URL da imagem."),
          alt: z.string().max(200).optional(),
          position: z.number().int().min(0),
        }),
      )
      .min(1, "Adicione pelo menos uma imagem.")
      .max(10, "Máximo de 10 imagens por produto."),
    videoUrl: z
      .string()
      .url("Informe uma URL de vídeo válida.")
      .or(z.literal(""))
      .optional(),
    isVerified: z.boolean().default(false),
    sizeType: productSizeTypeSchema,
    productSizes: z.array(productVariantSizeSchema).default([]),
    variantStocks: z.array(adminProductVariantStockSchema).default([]),
    // Discount & promotion
    discountPercent: z.coerce
      .number()
      .int()
      .min(1, "Desconto mínimo é 1%.")
      .max(99, "Desconto máximo é 99%.")
      .nullable()
      .optional(),
    badgeLabel: z.string().trim().max(20, "Máximo 20 caracteres.").optional(),
    pixDiscountText: z
      .string()
      .trim()
      .max(255, "Máximo 255 caracteres.")
      .optional(),
    // Customization
    isCustomizable: z.boolean().default(false),
    customizationLeadDays: z.coerce
      .number()
      .int()
      .min(0, "O prazo não pode ser negativo.")
      .default(2),
    nameFieldEnabled: z.boolean().default(false),
    nameFieldPriceInReais: z.coerce
      .number()
      .min(0, "O valor não pode ser negativo.")
      .default(0),
    numberFieldEnabled: z.boolean().default(false),
    numberFieldPriceInReais: z.coerce
      .number()
      .min(0, "O valor não pode ser negativo.")
      .default(0),
    patches: z.array(adminPatchOptionSchema).default([]),
    variantes: z
      .array(
        z.object({
          id: z.string().uuid().optional(),
          cor: z.string().trim().min(1, "Cor obrigatória"),
          tamanho: z
            .string()
            .trim()
            .min(1, "Tamanho obrigatório")
            .max(10, "Máximo 10 caracteres"),
          estoque: z.coerce
            .number()
            .int("Informe um número inteiro.")
            .min(0, "Estoque não pode ser negativo."),
          imageUrl: z
            .string()
            .url("URL inválida")
            .optional()
            .or(z.literal("")),
        }),
      )
      .default([]),
  })
  .superRefine((value, ctx) => {
    if (value.sizeType === "numeric" && value.productSizes.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Selecione ao menos um tamanho numerico.",
        path: ["productSizes"],
      });
    }

    if (value.variantes.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Adicione pelo menos uma variante.",
        path: ["variantes"],
      });
    }
  });

export const deleteAdminProductSchema = z.object({
  productId: z.uuid("Produto invalido."),
});

export type AdminProductFormValues = z.input<typeof adminProductSchema>;
export type AdminProductInput = z.infer<typeof adminProductSchema>;
export type DeleteAdminProductInput = z.infer<typeof deleteAdminProductSchema>;
