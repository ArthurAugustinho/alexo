import { z } from "zod";

export const updateSimpleBannerSchema = z.object({
  id: z.string().uuid("Banner inválido."),
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
  isActive: z.boolean(),
});

export type UpdateSimpleBannerInput = z.infer<typeof updateSimpleBannerSchema>;
