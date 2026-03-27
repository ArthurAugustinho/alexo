import { z } from "zod";

export const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid("ID de pedido inválido."),
  status: z.enum(["shipped", "delivered", "canceled", "refunded"]),
  trackingCode: z.string().max(100).optional().or(z.literal("")),
  trackingUrl: z.string().url("URL inválida.").optional().or(z.literal("")),
  statusNote: z.string().max(500).optional().or(z.literal("")),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
