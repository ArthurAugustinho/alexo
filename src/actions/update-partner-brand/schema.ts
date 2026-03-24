import { z } from "zod";

import { partnerBrandFormSchema } from "@/lib/partner-brand-schema";

export const updatePartnerBrandSchema = partnerBrandFormSchema.extend({
  id: z.uuid(),
});

export type UpdatePartnerBrandInput = z.infer<typeof updatePartnerBrandSchema>;
