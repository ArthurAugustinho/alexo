import { z } from "zod";

export const createCouponSchema = z
  .object({
    code: z
      .string()
      .min(3, "Código deve ter ao menos 3 caracteres.")
      .max(50)
      .regex(/^[A-Z0-9_-]+$/, "Código deve conter apenas letras maiúsculas, números, _ ou -.")
      .transform((v) => v.toUpperCase().trim()),
    description: z.string().max(255).optional().or(z.literal("")),
    type: z.enum(["percentage", "fixed", "free_shipping", "category"]),
    value: z.number().int().min(0),
    categoryId: z.string().uuid().optional().or(z.literal("")),
    minOrderValueInCents: z.number().int().min(0).default(0),
    maxDiscountInCents: z.number().int().min(1).optional(),
    maxUsesTotal: z.number().int().min(1).optional(),
    maxUsesPerUser: z.number().int().min(1).default(1),
    isFirstOrderOnly: z.boolean().default(false),
    isActive: z.boolean().default(true),
    startsAt: z.string().optional().or(z.literal("")),
    expiresAt: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.type === "percentage" && data.value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentual não pode ser maior que 100.",
        path: ["value"],
      });
    }
    if (data.type === "category" && data.value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentual de categoria não pode ser maior que 100.",
        path: ["value"],
      });
    }
    if (data.type !== "free_shipping" && data.value < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Valor deve ser maior que 0.",
        path: ["value"],
      });
    }
    if (data.type === "category" && !data.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione uma categoria para este tipo de cupom.",
        path: ["categoryId"],
      });
    }
    if (data.startsAt && data.expiresAt && data.startsAt >= data.expiresAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data de expiração deve ser posterior à data de início.",
        path: ["expiresAt"],
      });
    }
  });

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
