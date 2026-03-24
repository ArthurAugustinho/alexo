import { z } from "zod";

export const reorderPartnerBrandsSchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      position: z.number().int().min(0),
    }),
  ),
});

export type ReorderPartnerBrandsInput = z.infer<
  typeof reorderPartnerBrandsSchema
>;
