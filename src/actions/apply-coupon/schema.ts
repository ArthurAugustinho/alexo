import { z } from "zod";

export const applyCouponSchema = z.object({
  code: z
    .string()
    .min(1, "Digite o código do cupom.")
    .max(50)
    .transform((v) => v.toUpperCase().trim()),
});

export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
