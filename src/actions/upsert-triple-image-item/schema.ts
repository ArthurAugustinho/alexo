import { z } from "zod";

export const upsertTripleImageItemSchema = z.object({
  position: z.number().int().min(1).max(3),
  imageUrl: z
    .string()
    .min(1, "Informe a URL da imagem.")
    .refine(
      (val) => val.startsWith("/uploads/") || val.startsWith("http"),
      { message: "URL inválida." },
    ),
  linkUrl: z.string().url("URL inválida.").or(z.literal("")).optional(),
  isActive: z.boolean().default(true),
});

export type UpsertTripleImageItemInput = z.infer<typeof upsertTripleImageItemSchema>;
