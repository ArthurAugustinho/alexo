import { z } from "zod";

export const cancelReturnRequestSchema = z.object({
  returnRequestId: z.string().uuid("ID inválido."),
});

export type CancelReturnRequestInput = z.infer<typeof cancelReturnRequestSchema>;
