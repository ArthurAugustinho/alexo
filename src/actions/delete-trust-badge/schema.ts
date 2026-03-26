import { z } from "zod";

export const deleteTrustBadgeSchema = z.object({
  id: z.uuid("Selo inválido."),
});

export type DeleteTrustBadgeInput = z.infer<typeof deleteTrustBadgeSchema>;
