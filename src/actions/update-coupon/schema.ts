import { z } from "zod";

import { createCouponSchema } from "@/actions/create-coupon/schema";

export const updateCouponSchema = createCouponSchema.extend({
  couponId: z.string().uuid("ID inválido."),
});

export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
