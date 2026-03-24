import { z } from "zod";

export const togglePartnerBrandSchema = z.object({
  id: z.uuid(),
  isActive: z.boolean(),
});

export type TogglePartnerBrandInput = z.infer<typeof togglePartnerBrandSchema>;
