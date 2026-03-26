import { z } from "zod";

export const updateFaqItemSchema = z.object({
  id: z.uuid("Item inválido."),
  question: z
    .string()
    .trim()
    .min(1, "Informe a pergunta.")
    .max(300, "A pergunta deve ter no máximo 300 caracteres."),
  answer: z.string().trim().min(1, "Informe a resposta."),
  isActive: z.boolean(),
});

export type UpdateFaqItemInput = z.infer<typeof updateFaqItemSchema>;
