import { z } from "zod";

export const reorderAnnouncementBarsSchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      position: z.number().int().min(0),
    }),
  ),
});

export type ReorderAnnouncementBarsInput = z.infer<
  typeof reorderAnnouncementBarsSchema
>;
