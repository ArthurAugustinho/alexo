import z from "zod";

export const registerAdminUserSchema = z
  .object({
    name: z.string("Nome inv\u00e1lido.").trim().min(1, "Nome \u00e9 obrigat\u00f3rio."),
    email: z.email("E-mail inv\u00e1lido."),
    password: z
      .string("Senha inv\u00e1lida.")
      .min(8, "A senha deve ter pelo menos 8 caracteres."),
    passwordConfirmation: z
      .string("Senha inv\u00e1lida.")
      .min(8, "A senha deve ter pelo menos 8 caracteres."),
    accessKey: z.string().trim().optional(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    error: "As senhas n\u00e3o coincidem.",
    path: ["passwordConfirmation"],
  });

export type RegisterAdminUserInput = z.infer<typeof registerAdminUserSchema>;
