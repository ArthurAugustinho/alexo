import { ProductCarousel } from "@/components/home/product-carousel";
import { getNewestStorefrontProducts } from "@/lib/storefront-showcase";

export async function NewArrivalsSection() {
  const products = await getNewestStorefrontProducts();

  return (
    <ProductCarousel
      title="Novidades"
      ariaLabel="Carrossel de novidades"
      badgeLabel="Novo"
      emptyMessage="Nenhum produto novo foi encontrado para exibição no momento."
      products={products}
    />
  );
}
