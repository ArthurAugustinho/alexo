import { z } from "zod";

export const bulkUpdateOrderStatusSchema = z.object({
  orderIds: z
    .array(z.string().uuid("ID de pedido inválido."))
    .min(1, "Selecione ao menos um pedido."),
  status: z.enum(["shipped", "delivered", "canceled", "refunded"]),
});

export type BulkUpdateOrderStatusInput = z.infer<
  typeof bulkUpdateOrderStatusSchema
>;
