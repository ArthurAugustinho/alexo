import { z } from "zod";

export const upsertSupportWidgetSchema = z
  .object({
    whatsappNumber: z
      .string()
      .regex(
        /^\d{10,15}$/,
        "Número inválido. Use apenas dígitos com DDI, ex: 5511999999999",
      )
      .or(z.literal(""))
      .optional(),
    whatsappMessage: z.string().max(255).or(z.literal("")).optional(),
    supportEmail: z
      .string()
      .email("E-mail inválido.")
      .or(z.literal(""))
      .optional(),
    isActive: z.boolean(),
  })
  .refine(
    (data) => {
      if (!data.isActive) return true;
      const hasWhatsapp = Boolean(data.whatsappNumber?.trim());
      const hasEmail = Boolean(data.supportEmail?.trim());
      return hasWhatsapp || hasEmail;
    },
    {
      message:
        "Para ativar o widget, informe ao menos o número do WhatsApp ou o email de suporte.",
      path: ["isActive"],
    },
  );

export type UpsertSupportWidgetInput = z.infer<
  typeof upsertSupportWidgetSchema
>;
