import { z } from "zod";

import { announcementBarFormSchema } from "@/lib/announcement-bar-schema";

export const updateAnnouncementBarSchema = announcementBarFormSchema.extend({
  id: z.uuid(),
});

export type UpdateAnnouncementBarInput = z.infer<
  typeof updateAnnouncementBarSchema
>;
