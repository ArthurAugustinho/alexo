import { z } from "zod";

export const upsertProductImagesSchema = z.object({
  productId: z.uuid("Produto inválido."),
  images: z
    .array(
      z.object({
        id: z.uuid().optional(),
        url: z
          .string()
          .min(1, "Informe a URL da imagem.")
          .refine(
            (val) => val.startsWith("/uploads/") || val.startsWith("http"),
            { message: "URL inválida." },
          ),
        alt: z.string().max(200).optional(),
        position: z.number().int().min(0),
      }),
    )
    .min(1, "Adicione pelo menos uma imagem.")
    .max(10, "Máximo de 10 imagens por produto."),
});

export type UpsertProductImagesInput = z.infer<typeof upsertProductImagesSchema>;
