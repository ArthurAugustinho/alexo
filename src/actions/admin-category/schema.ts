import z from "zod";

export const adminCategorySchema = z.object({
  categoryId: z.uuid().optional(),
  name: z
    .string("Nome inválido.")
    .trim()
    .min(2, "Informe o nome da categoria."),
});

export const deleteAdminCategorySchema = z.object({
  categoryId: z.uuid("Categoria inválida."),
});

export type AdminCategoryFormValues = z.input<typeof adminCategorySchema>;
export type AdminCategoryInput = z.infer<typeof adminCategorySchema>;
export type DeleteAdminCategoryInput = z.infer<
  typeof deleteAdminCategorySchema
>;
