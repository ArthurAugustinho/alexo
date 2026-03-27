import { z } from "zod";

export const deleteCouponSchema = z.object({
  couponId: z.string().uuid("ID inválido."),
});

export type DeleteCouponInput = z.infer<typeof deleteCouponSchema>;
