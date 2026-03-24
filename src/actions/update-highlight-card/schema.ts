import { z } from "zod";

import { highlightCardFormSchema } from "@/lib/highlight-card-schema";

export const updateHighlightCardSchema = highlightCardFormSchema.extend({
  id: z.uuid(),
});

export type UpdateHighlightCardInput = z.infer<typeof updateHighlightCardSchema>;
