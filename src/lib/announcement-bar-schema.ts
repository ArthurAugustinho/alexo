import { z } from "zod";

export const announcementBarFormSchema = z
  .object({
    text: z
      .string()
      .min(1, "Texto é obrigatório")
      .max(255, "Máximo 255 caracteres"),
    linkUrl: z
      .string()
      .url("URL inválida")
      .or(z.literal(""))
      .optional(),
    bgColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Cor de fundo inválida"),
    textColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Cor do texto inválida"),
    isActive: z.boolean().default(true),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
      }
      return true;
    },
    {
      message: "A data de início deve ser anterior à data de fim",
      path: ["endDate"],
    },
  );

export type AnnouncementBarFormValues = z.input<typeof announcementBarFormSchema>;
export type AnnouncementBarInput = z.infer<typeof announcementBarFormSchema>;
