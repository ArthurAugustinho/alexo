import { z } from "zod";

export const deleteFaqItemSchema = z.object({
  id: z.uuid("Item inválido."),
});

export type DeleteFaqItemInput = z.infer<typeof deleteFaqItemSchema>;
