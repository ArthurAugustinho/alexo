import { z } from "zod";

export const sendContactEmailSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome deve ter no mínimo 2 caracteres.")
    .max(100),
  email: z.string().trim().email("E-mail inválido."),
  subject: z
    .string()
    .trim()
    .min(1, "Informe o assunto.")
    .max(100, "Máximo 100 caracteres."),
  message: z
    .string()
    .trim()
    .min(10, "A mensagem deve ter no mínimo 10 caracteres.")
    .max(2000, "Máximo 2000 caracteres."),
});

export type SendContactEmailInput = z.infer<typeof sendContactEmailSchema>;
