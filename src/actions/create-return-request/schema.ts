import { z } from "zod";

export const createReturnRequestSchema = z.object({
  orderId: z.string().uuid("ID de pedido inválido."),
  reason: z.enum(["defect", "wrong_item", "damaged", "wrong_size", "other"]),
  description: z
    .string()
    .min(20, "Descreva o problema com ao menos 20 caracteres.")
    .max(2000),
  photoUrl: z.string().optional().or(z.literal("")),
});

export type CreateReturnRequestInput = z.infer<typeof createReturnRequestSchema>;
