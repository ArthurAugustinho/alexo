import { z } from "zod";

export const createFaqItemSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Informe a pergunta.")
    .max(300, "A pergunta deve ter no máximo 300 caracteres."),
  answer: z.string().trim().min(1, "Informe a resposta."),
  isActive: z.boolean().default(true),
});

export type CreateFaqItemInput = z.infer<typeof createFaqItemSchema>;
