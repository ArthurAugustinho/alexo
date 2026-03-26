import { z } from "zod";

export const createTrustBadgeSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Informe o nome do selo.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),
  imageUrl: z
    .string()
    .trim()
    .min(1, "Informe a URL da imagem.")
    .refine(
      (val) =>
        val.startsWith("/uploads/") ||
        val.startsWith("http://") ||
        val.startsWith("https://"),
      { message: "URL da imagem inválida." },
    ),
  linkUrl: z.string().url("URL do link inválida.").or(z.literal("")).optional(),
  isActive: z.boolean().default(true),
});

export type CreateTrustBadgeInput = z.infer<typeof createTrustBadgeSchema>;
