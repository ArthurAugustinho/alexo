import { z } from "zod";

export const deletePartnerBrandSchema = z.object({
  id: z.uuid(),
});

export type DeletePartnerBrandInput = z.infer<typeof deletePartnerBrandSchema>;
