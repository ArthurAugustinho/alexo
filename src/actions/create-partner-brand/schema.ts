import { z } from "zod";

import { partnerBrandFormSchema } from "@/lib/partner-brand-schema";

export const createPartnerBrandSchema = partnerBrandFormSchema.omit({
  position: true,
});

export type CreatePartnerBrandInput = z.infer<typeof createPartnerBrandSchema>;
