import { z } from "zod";

export const toggleSimpleBannerSchema = z.object({
  id: z.string().uuid("Banner inválido."),
  isActive: z.boolean(),
});

export type ToggleSimpleBannerInput = z.infer<typeof toggleSimpleBannerSchema>;
