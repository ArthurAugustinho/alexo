import { z } from "zod";

export const createAddressSchema = z.object({
  label: z.string().min(1, "Rótulo é obrigatório").max(50),
  recipientName: z.string().min(2, "Nome do destinatário é obrigatório").max(100),
  phone: z
    .string()
    .regex(/^\d{10,11}$/, "Telefone inválido (DDD + número)")
    .or(z.literal("")),
  zipCode: z.string().regex(/^\d{8}$/, "CEP inválido (apenas 8 dígitos)"),
  street: z.string().min(1, "Rua é obrigatória").max(200),
  number: z.string().min(1, "Número é obrigatório").max(20),
  complement: z.string().max(100).optional().or(z.literal("")),
  neighborhood: z.string().min(1, "Bairro é obrigatório").max(100),
  city: z.string().min(1, "Cidade é obrigatória").max(100),
  state: z.string().length(2, "Use a sigla do estado (ex: SP)"),
  isDefault: z.boolean(),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
