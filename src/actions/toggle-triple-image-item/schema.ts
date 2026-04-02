import { z } from "zod";

export const toggleTripleImageItemSchema = z.object({
  id: z.string().uuid("Item inválido."),
  isActive: z.boolean(),
});

export type ToggleTripleImageItemInput = z.infer<typeof toggleTripleImageItemSchema>;
