import { z } from "zod";

export const createSimpleBannerSchema = z.object({
  imageUrl: z
    .string()
    .min(1, "Informe a URL da imagem.")
    .refine(
      (val) => val.startsWith("/uploads/") || val.startsWith("http"),
      { message: "URL inválida." },
    ),
  mobileImageUrl: z
    .string()
    .refine(
      (val) => val === "" || val.startsWith("/uploads/") || val.startsWith("http"),
      { message: "URL inválida." },
    )
    .optional(),
  linkUrl: z.string().url("URL inválida.").or(z.literal("")).optional(),
  isActive: z.boolean().default(true),
});

export type CreateSimpleBannerInput = z.infer<typeof createSimpleBannerSchema>;
