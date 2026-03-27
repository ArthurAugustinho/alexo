import { z } from "zod";

export const removeCouponSchema = z.object({});

export type RemoveCouponInput = z.infer<typeof removeCouponSchema>;
