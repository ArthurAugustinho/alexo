import z from "zod";

export const adminProductSchema = z.object({
  productId: z.uuid().optional(),
  primaryVariantId: z.uuid().optional(),
  name: z.string("Nome inv\u00e1lido.").trim().min(2, "Informe o nome do produto."),
  description: z
    .string("Descri\u00e7\u00e3o inv\u00e1lida.")
    .trim()
    .min(10, "A descri\u00e7\u00e3o precisa ter pelo menos 10 caracteres."),
  categoryId: z.uuid("Categoria inv\u00e1lida."),
  variantName: z
    .string("Nome da varia\u00e7\u00e3o inv\u00e1lido.")
    .trim()
    .min(1, "Informe o nome da varia\u00e7\u00e3o."),
  variantColor: z
    .string("Cor inv\u00e1lida.")
    .trim()
    .min(1, "Informe a cor da varia\u00e7\u00e3o."),
  priceInReais: z.coerce
    .number("Pre\u00e7o inv\u00e1lido.")
    .positive("O pre\u00e7o precisa ser maior que zero."),
  imageUrl: z.url("Informe uma URL de imagem v\u00e1lida."),
});

export const deleteAdminProductSchema = z.object({
  productId: z.uuid("Produto inv\u00e1lido."),
});

export type AdminProductFormValues = z.input<typeof adminProductSchema>;
export type AdminProductInput = z.infer<typeof adminProductSchema>;
export type DeleteAdminProductInput = z.infer<typeof deleteAdminProductSchema>;
