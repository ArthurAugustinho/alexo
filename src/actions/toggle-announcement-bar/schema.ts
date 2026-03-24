import { z } from "zod";

export const toggleAnnouncementBarSchema = z.object({
  id: z.uuid(),
  isActive: z.boolean(),
});

export type ToggleAnnouncementBarInput = z.infer<
  typeof toggleAnnouncementBarSchema
>;
