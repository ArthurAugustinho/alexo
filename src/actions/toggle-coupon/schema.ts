import { z } from "zod";

export const toggleCouponSchema = z.object({
  couponId: z.string().uuid("ID inválido."),
  isActive: z.boolean(),
});

export type ToggleCouponInput = z.infer<typeof toggleCouponSchema>;
