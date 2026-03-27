import { z } from "zod";

export const reviewReturnRequestSchema = z
  .object({
    returnRequestId: z.string().uuid("ID inválido."),
    status: z.enum(["approved", "rejected"]),
    adminNote: z
      .string()
      .min(1, "Nota ao cliente é obrigatória.")
      .max(1000),
    returnCode: z.string().max(100).optional().or(z.literal("")),
    returnUrl: z.string().url("URL inválida.").optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.status === "approved" && !data.returnCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Código de postagem é obrigatório para aprovação.",
        path: ["returnCode"],
      });
    }
  });

export type ReviewReturnRequestInput = z.infer<typeof reviewReturnRequestSchema>;
