import { ProductCarouselSection } from "@/components/product/product-carousel-section";
import type { CarouselProduct } from "@/lib/queries/products";

type PromoCarouselProps = {
  products: CarouselProduct[];
};

export function PromoCarousel({ products }: PromoCarouselProps) {
  if (products.length === 0) return null;

  return <ProductCarouselSection title="Promoções" products={products} />;
}
