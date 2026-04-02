import { getSaleProducts } from "@/lib/queries/products";

import { ProductCarouselSection } from "./product-carousel-section";

type SaleCarouselProps = {
  currentProductId: string;
};

export async function SaleCarousel({ currentProductId }: SaleCarouselProps) {
  const products = await getSaleProducts(currentProductId);
  return <ProductCarouselSection title="Baixou de preço" products={products} />;
}
