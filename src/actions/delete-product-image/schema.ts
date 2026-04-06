import { z } from "zod";

export const deleteProductImageSchema = z.object({
  imageId: z.uuid("Imagem inválida."),
});

export type DeleteProductImageInput = z.infer<typeof deleteProductImageSchema>;
