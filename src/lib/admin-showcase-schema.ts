import { z } from "zod";

function isInternalOrExternalUrl(value: string) {
  return (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  );
}

export const adminBannerSchema = z
  .object({
    bannerId: z.uuid().optional(),
    imageUrl: z
      .string("Imagem invÃ¡lida.")
      .trim()
      .min(1, "Informe a imagem do banner.")
      .refine(isInternalOrExternalUrl, "Informe uma URL de imagem vÃ¡lida."),
    title: z.string("TÃ­tulo invÃ¡lido.").trim().min(1, "Informe o tÃ­tulo."),
    subtitle: z
      .string("SubtÃ­tulo invÃ¡lido.")
      .trim()
      .min(1, "Informe o subtÃ­tulo."),
    linkUrl: z
      .string("Link invÃ¡lido.")
      .trim()
      .min(1, "Informe o link do banner.")
      .refine(isInternalOrExternalUrl, "Informe um link vÃ¡lido."),
    startDate: z.coerce.date("Data inicial invÃ¡lida."),
    endDate: z.coerce.date("Data final invÃ¡lida."),
  })
  .superRefine((value, context) => {
    if (value.startDate >= value.endDate) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "A data final precisa ser posterior Ã  data inicial.",
      });
    }
  });

export const deleteBannerSchema = z.object({
  bannerId: z.uuid("Banner invÃ¡lido."),
});

export const addFeaturedProductSchema = z.object({
  productId: z.uuid("Produto invÃ¡lido."),
});

export const removeFeaturedProductSchema = z.object({
  featuredProductId: z.uuid("Item destacado invÃ¡lido."),
});

export const reorderFeaturedProductsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.uuid("Item destacado invÃ¡lido."),
        position: z.number().int().min(0),
      }),
    )
    .max(10, "A vitrine manual aceita no mÃ¡ximo 10 produtos."),
});

export const adminBannerListItemSchema = z.object({
  id: z.uuid(),
  imageUrl: z.string().trim().min(1),
  title: z.string().trim().min(1),
  subtitle: z.string().trim().min(1),
  linkUrl: z.string().trim().min(1),
  startDate: z.date(),
  endDate: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const adminBannerListSchema = z.array(adminBannerListItemSchema);

export const featuredProductListItemSchema = z.object({
  id: z.uuid(),
  position: z.number().int().min(0),
  productId: z.uuid(),
  productName: z.string().trim().min(1),
  productSlug: z.string().trim().min(1),
  imageUrl: z.url(),
  priceInCents: z.number().int().nonnegative(),
  variantSlug: z.string().trim().min(1),
});

export const featuredProductListSchema = z.array(featuredProductListItemSchema);

export const featuredProductSearchItemSchema = z.object({
  productId: z.uuid(),
  productName: z.string().trim().min(1),
  productSlug: z.string().trim().min(1),
  imageUrl: z.url(),
  priceInCents: z.number().int().nonnegative(),
  variantSlug: z.string().trim().min(1),
  alreadyFeatured: z.boolean(),
});

export const featuredProductSearchSchema = z.array(
  featuredProductSearchItemSchema,
);

export type AdminBannerFormValues = z.input<typeof adminBannerSchema>;
export type AdminBannerInput = z.infer<typeof adminBannerSchema>;
export type DeleteBannerInput = z.infer<typeof deleteBannerSchema>;
export type AddFeaturedProductInput = z.infer<typeof addFeaturedProductSchema>;
export type RemoveFeaturedProductInput = z.infer<
  typeof removeFeaturedProductSchema
>;
export type ReorderFeaturedProductsInput = z.infer<
  typeof reorderFeaturedProductsSchema
>;
export type AdminBannerListItem = z.infer<typeof adminBannerListItemSchema>;
export type FeaturedProductListItem = z.infer<
  typeof featuredProductListItemSchema
>;
export type FeaturedProductSearchItem = z.infer<
  typeof featuredProductSearchItemSchema
>;
