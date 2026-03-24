import { z } from "zod";

export const partnerBrandFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório.").max(100, "Máximo 100 caracteres."),
  logoUrl: z.string().url("URL da logo inválida."),
  linkUrl: z
    .string()
    .url("URL inválida.")
    .optional()
    .or(z.literal("")),
  isActive: z.boolean(),
  position: z.number().int().min(0),
});

export type PartnerBrandFormValues = z.infer<typeof partnerBrandFormSchema>;
