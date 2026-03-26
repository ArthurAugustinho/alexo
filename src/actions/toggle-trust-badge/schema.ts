import { z } from "zod";

export const toggleTrustBadgeSchema = z.object({
  id: z.uuid("Selo inválido."),
  isActive: z.boolean(),
});

export type ToggleTrustBadgeInput = z.infer<typeof toggleTrustBadgeSchema>;
