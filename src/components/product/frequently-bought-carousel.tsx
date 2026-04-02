import { getFrequentlyBoughtProducts } from "@/lib/queries/products";

import { ProductCarouselSection } from "./product-carousel-section";

type FrequentlyBoughtCarouselProps = {
  currentProductId: string;
};

export async function FrequentlyBoughtCarousel({
  currentProductId,
}: FrequentlyBoughtCarouselProps) {
  const products = await getFrequentlyBoughtProducts(currentProductId);
  return (
    <ProductCarouselSection
      title="Frequentemente comprados juntos"
      products={products}
    />
  );
}
