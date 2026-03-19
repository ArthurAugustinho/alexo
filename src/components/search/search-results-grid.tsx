import { ProductCard } from "@/components/home/product-card";
import { type SearchProduct } from "@/lib/queries/search";

type SearchResultsGridProps = {
  products: SearchProduct[];
};

export function SearchResultsGrid({ products }: SearchResultsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {products.map((product) => (
        <div key={product.id} className="flex justify-center">
          <ProductCard
            badgeLabel={product.brand ?? product.categoryName}
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              variantSlug: product.variantSlug,
              imageUrl: product.imageUrl,
              priceInCents: product.priceInCents,
            }}
          />
        </div>
      ))}
    </div>
  );
}
