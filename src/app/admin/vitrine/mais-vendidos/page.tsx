import { FeaturedProductsManagement } from "@/components/admin/featured-products-management";
import {
  getAdminFeaturedProducts,
  searchAdminProductsForFeatured,
} from "@/lib/admin-showcase";

type AdminFeaturedProductsPageProps = {
  searchParams: Promise<{
    query?: string;
  }>;
};

export default async function AdminFeaturedProductsPage({
  searchParams,
}: AdminFeaturedProductsPageProps) {
  const { query = "" } = await searchParams;
  const [featuredProducts, searchResults] = await Promise.all([
    getAdminFeaturedProducts(),
    searchAdminProductsForFeatured(query),
  ]);

  return (
    <FeaturedProductsManagement
      featuredProducts={featuredProducts}
      searchResults={searchResults}
      searchTerm={query}
    />
  );
}
