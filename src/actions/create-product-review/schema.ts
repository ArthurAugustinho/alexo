import { z } from "zod";

export const createProductReviewSchema = z.object({
  productId: z.uuid("Produto inválido."),
  rating: z.coerce
    .number()
    .int()
    .min(1, "Avalie com pelo menos 1 estrela.")
    .max(5, "Avaliação máxima é 5 estrelas."),
  title: z.string().trim().max(150, "Máximo 150 caracteres.").optional(),
  body: z.string().trim().max(2000, "Máximo 2000 caracteres.").optional(),
  photoUrls: z
    .array(z.string().url("URL de foto inválida."))
    .max(3, "Máximo 3 fotos.")
    .default([]),
});

export type CreateProductReviewInput = z.infer<typeof createProductReviewSchema>;
