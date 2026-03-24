import { z } from "zod";

import { announcementBarFormSchema } from "@/lib/announcement-bar-schema";

export const createAnnouncementBarSchema = announcementBarFormSchema;

export type CreateAnnouncementBarInput = z.infer<
  typeof createAnnouncementBarSchema
>;
