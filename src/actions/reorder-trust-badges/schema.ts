import { z } from "zod";

export const reorderTrustBadgesSchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid("Selo inválido."),
      position: z.number().int().min(0),
    }),
  ),
});

export type ReorderTrustBadgesInput = z.infer<typeof reorderTrustBadgesSchema>;
