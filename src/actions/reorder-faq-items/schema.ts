import { z } from "zod";

export const reorderFaqItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid("Item inválido."),
      position: z.number().int().min(0),
    }),
  ),
});

export type ReorderFaqItemsInput = z.infer<typeof reorderFaqItemsSchema>;
