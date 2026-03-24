import { z } from "zod";

export const deleteHighlightCardSchema = z.object({
  id: z.uuid(),
});

export type DeleteHighlightCardInput = z.infer<typeof deleteHighlightCardSchema>;
