import { z } from "zod";

export const toggleSocialLinkSchema = z.object({
  id: z.uuid("Link inválido."),
  isActive: z.boolean(),
});

export type ToggleSocialLinkInput = z.infer<typeof toggleSocialLinkSchema>;
