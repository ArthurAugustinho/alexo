import { z } from "zod";

function isValidBannerLinkUrl(value: string) {
  return (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  );
}

function isValidBannerImageUrl(value: string) {
  return (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  );
}

export const seasonalBannerSchema = z.object({
  id: z.uuid(),
  imageUrl: z
    .string()
    .trim()
    .min(1)
    .refine(isValidBannerImageUrl, "Imagem do banner inválida."),
  title: z.string().trim().min(1),
  subtitle: z.string().trim().min(1),
  linkUrl: z
    .string()
    .trim()
    .min(1)
    .refine(isValidBannerLinkUrl, "Link do banner inválido."),
  startDate: z.date(),
  endDate: z.date(),
});

export const seasonalBannerListSchema = z.array(seasonalBannerSchema);

export const storefrontProductSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  variantSlug: z.string().trim().min(1),
  imageUrl: z.url(),
  priceInCents: z.number().int().nonnegative(),
});

export const storefrontProductListSchema = z.array(storefrontProductSchema);

export type SeasonalBanner = z.infer<typeof seasonalBannerSchema>;
export type StorefrontProduct = z.infer<typeof storefrontProductSchema>;
