import { z } from "zod";

export const deleteAnnouncementBarSchema = z.object({
  id: z.uuid(),
});

export type DeleteAnnouncementBarInput = z.infer<
  typeof deleteAnnouncementBarSchema
>;
