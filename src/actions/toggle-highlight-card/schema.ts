import { z } from "zod";

export const toggleHighlightCardSchema = z.object({
  id: z.uuid(),
  isActive: z.boolean(),
});

export type ToggleHighlightCardInput = z.infer<typeof toggleHighlightCardSchema>;
