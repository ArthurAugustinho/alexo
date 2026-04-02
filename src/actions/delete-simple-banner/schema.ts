import { z } from "zod";

export const deleteSimpleBannerSchema = z.object({
  id: z.string().uuid("Banner inválido."),
});

export type DeleteSimpleBannerInput = z.infer<typeof deleteSimpleBannerSchema>;
