import { z } from "zod";

export const toggleFaqItemSchema = z.object({
  id: z.uuid("Item inválido."),
  isActive: z.boolean(),
});

export type ToggleFaqItemInput = z.infer<typeof toggleFaqItemSchema>;
