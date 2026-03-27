import { z } from "zod";

export const updateAvatarSchema = z.object({
  imageUrl: z.string().url("URL inválida."),
});

export type UpdateAvatarInput = z.infer<typeof updateAvatarSchema>;
