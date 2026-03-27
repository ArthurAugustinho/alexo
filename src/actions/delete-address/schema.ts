import { z } from "zod";

export const deleteAddressSchema = z.object({
  addressId: z.string().uuid("ID inválido."),
});

export type DeleteAddressInput = z.infer<typeof deleteAddressSchema>;
