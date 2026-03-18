import { ProductCarousel } from "@/components/home/product-carousel";
import { getBestSellingStorefrontProducts } from "@/lib/storefront-showcase";

export async function BestSellersSection() {
  const products = await getBestSellingStorefrontProducts();

  return (
    <ProductCarousel
      title="Mais vendidos"
      ariaLabel="Carrossel de produtos mais vendidos"
      badgeLabel="Mais Vendido"
      emptyMessage="Ainda não existem produtos vendidos o suficiente para destacar nesta seção."
      products={products}
    />
  );
}
