import { z } from "zod";

export const addProductToCartSchema = z.object({
  productVariantId: z.uuid(),
  quantity: z.number().min(1),
});

export type AddProductToCartSchema = z.infer<typeof addProductToCartSchema>;

export const decreaseCartProductQuantitySchema = z.object({
  cartItemId: z.uuid(),
});

export type DecreaseCartProductQuantitySchema = z.infer<
  typeof decreaseCartProductQuantitySchema
>;

export const removeProductFromCartSchema = z.object({
  cartItemId: z.uuid(),
});

export type RemoveProductFromCartSchema = z.infer<
  typeof removeProductFromCartSchema
>;

export const updateCartShippingAddressSchema = z.object({
  shippingAddressId: z.string().uuid(),
});

export type UpdateCartShippingAddressSchema = z.infer<
  typeof updateCartShippingAddressSchema
>;
