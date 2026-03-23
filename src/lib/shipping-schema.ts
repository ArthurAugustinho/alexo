import { z } from "zod";

export const DEFAULT_PRODUCT_PACKAGE = {
  weightGrams: 500,
  widthCm: 30,
  heightCm: 5,
  lengthCm: 30,
} as const;

export const LAST_POSTAL_CODE_STORAGE_KEY = "last_postal_code";

export const shippingPostalCodeSchema = z.string().regex(/^\d{8}$/, {
  message: "CEP invalido",
});

export const shippingCalculateRequestSchema = z.object({
  postalCode: shippingPostalCodeSchema,
  productId: z.uuid(),
  quantity: z.coerce.number().int().min(1).default(1),
});

export const shippingOptionSchema = z.object({
  id: z.number().int(),
  name: z.string().trim().min(1),
  company: z.string().trim().min(1),
  price: z.number().nonnegative(),
  priceInCents: z.number().int().nonnegative(),
  deliveryTime: z.number().int().nonnegative(),
  logoUrl: z.string().trim().min(1),
});

export const shippingOptionsResponseSchema = z.array(shippingOptionSchema);

export type ShippingCalculateRequest = z.infer<
  typeof shippingCalculateRequestSchema
>;
export type ShippingOption = z.infer<typeof shippingOptionSchema>;

export function normalizePostalCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

export function formatPostalCode(value: string) {
  const digits = normalizePostalCode(value);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
