import { z } from "zod";

export const setDefaultAddressSchema = z.object({
  addressId: z.string().uuid("ID inválido."),
});

export type SetDefaultAddressInput = z.infer<typeof setDefaultAddressSchema>;
