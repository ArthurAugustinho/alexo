import { z } from "zod";

export const registerAdminUserSchema = z
  .object({
    name: z.string("Nome inválido.").trim().min(1, "Nome é obrigatório."),
    email: z.email("E-mail inválido."),
    password: z
      .string("Senha inválida.")
      .min(8, "A senha deve ter pelo menos 8 caracteres."),
    passwordConfirmation: z
      .string("Senha inválida.")
      .min(8, "A senha deve ter pelo menos 8 caracteres."),
    accessKey: z.string().trim().optional(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    error: "As senhas não coincidem.",
    path: ["passwordConfirmation"],
  });

export type RegisterAdminUserInput = z.infer<typeof registerAdminUserSchema>;
