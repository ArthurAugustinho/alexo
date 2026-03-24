import { z } from "zod";

export const highlightCardFormSchema = z.object({
  title: z.string().min(1, "Título obrigatório.").max(100, "Máximo 100 caracteres."),
  imageUrl: z
    .string()
    .min(1, "Imagem obrigatória.")
    .refine(
      (val) =>
        val.startsWith("/uploads/") ||
        val.startsWith("http://") ||
        val.startsWith("https://"),
      { message: "URL da imagem inválida." },
    ),
  linkUrl: z.string().url("Link inválido."),
  position: z.number().int().min(1).max(3),
  isActive: z.boolean(),
});

export type HighlightCardFormValues = z.infer<typeof highlightCardFormSchema>;
