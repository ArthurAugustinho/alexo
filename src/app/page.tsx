import { unstable_noStore as noStore } from "next/cache";
import { Suspense } from "react";

import CategorySelector from "@/components/common/category-selector";
import Footer from "@/components/common/footer";
import { Header } from "@/components/common/header";
import { BannerCarouselSkeleton } from "@/components/home/banner-carousel-skeleton";
import { BannerShowcase } from "@/components/home/banner-showcase";
import { BestSellersSection } from "@/components/home/best-sellers-section";
import { BrandShowcase } from "@/components/home/brand-showcase";
import { FeatureHighlight } from "@/components/home/feature-highlight";
import { NewArrivalsSection } from "@/components/home/new-arrivals-section";
import { ProductCarouselSkeleton } from "@/components/home/product-carousel-skeleton";
import { db } from "@/db";
import { categoryTable } from "@/db/schema";
import { getActiveHighlightCards } from "@/lib/queries/highlight-cards";
import { getActivePartnerBrands } from "@/lib/queries/partner-brands";

const Home = async () => {
  noStore();

  const [categories, brands, highlightCards] = await Promise.all([
    db.query.categoryTable.findMany({
      orderBy: [categoryTable.name],
    }),
    getActivePartnerBrands(),
    getActiveHighlightCards(),
  ]);

  return (
    <>
      <Header />
      <div className="space-y-10 py-6">
        <Suspense fallback={<BannerCarouselSkeleton />}>
          <BannerShowcase />
        </Suspense>

        <BrandShowcase brands={brands} />

        <Suspense
          fallback={<ProductCarouselSkeleton title="Mais vendidos" />}
        >
          <BestSellersSection />
        </Suspense>

        <FeatureHighlight cards={highlightCards} />

        <div className="px-5">
          <CategorySelector categories={categories} />
        </div>

        <Suspense fallback={<ProductCarouselSkeleton title="Novidades" />}>
          <NewArrivalsSection />
        </Suspense>

        <Footer />
      </div>
    </>
  );
};

export default Home;
