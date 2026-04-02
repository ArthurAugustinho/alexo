import {
  getRecommendedProducts,
} from "@/lib/queries/products";

import { ProductCarouselSection } from "./product-carousel-section";

type RecommendedCarouselProps = {
  categoryId: string;
  currentProductId: string;
};

export async function RecommendedCarousel({
  categoryId,
  currentProductId,
}: RecommendedCarouselProps) {
  const products = await getRecommendedProducts(categoryId, currentProductId);
  return (
    <ProductCarouselSection title="Recomendado para você" products={products} />
  );
}
