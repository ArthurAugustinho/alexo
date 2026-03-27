import { z } from "zod";

export const completeReturnRequestSchema = z.object({
  returnRequestId: z.string().uuid("ID inválido."),
});

export type CompleteReturnRequestInput = z.infer<
  typeof completeReturnRequestSchema
>;
