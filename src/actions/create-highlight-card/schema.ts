import { z } from "zod";

import { highlightCardFormSchema } from "@/lib/highlight-card-schema";

export const createHighlightCardSchema = highlightCardFormSchema;

export type CreateHighlightCardInput = z.infer<typeof createHighlightCardSchema>;
