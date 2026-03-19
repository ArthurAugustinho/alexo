import { z } from "zod";

export const createShippingAddressSchema = z.object({
  email: z.email("E-mail invÃ¡lido"),
  fullName: z.string().min(1, "Nome completo Ã© obrigatÃ³rio"),
  cpf: z.string().min(14, "CPF invÃ¡lido"),
  phone: z.string().min(15, "Celular invÃ¡lido"),
  zipCode: z.string().min(9, "CEP invÃ¡lido"),
  address: z.string().min(1, "EndereÃ§o Ã© obrigatÃ³rio"),
  number: z.string().min(1, "NÃºmero Ã© obrigatÃ³rio"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro Ã© obrigatÃ³rio"),
  city: z.string().min(1, "Cidade Ã© obrigatÃ³ria"),
  state: z.string().min(1, "Estado Ã© obrigatÃ³rio"),
});

export type CreateShippingAddressSchema = z.infer<
  typeof createShippingAddressSchema
>;
