import { unstable_noStore as noStore } from "next/cache";
import { Suspense } from "react";

import { Header } from "@/components/common/header";
import { BannerCarouselSkeleton } from "@/components/home/banner-carousel-skeleton";
import { BannerShowcase } from "@/components/home/banner-showcase";
import { BestSellersSection } from "@/components/home/best-sellers-section";
import { BrandShowcase } from "@/components/home/brand-showcase";
import { FeatureHighlight } from "@/components/home/feature-highlight";
import { NewArrivalsSection } from "@/components/home/new-arrivals-section";
import { ProductCarouselSkeleton } from "@/components/home/product-carousel-skeleton";
import { PromoCarousel } from "@/components/home/promo-carousel";
import { SimpleBanner } from "@/components/home/simple-banner";
import { TripleImageGrid } from "@/components/home/triple-image-grid";
import { getActiveHighlightCards } from "@/lib/queries/highlight-cards";
import { getActivePartnerBrands } from "@/lib/queries/partner-brands";
import { getOnSaleProducts } from "@/lib/queries/products";
import { getActiveSimpleBanner } from "@/lib/queries/simple-banner";
import { getActiveTripleImageGrid } from "@/lib/queries/triple-image-grid";

const Home = async () => {
  noStore();

  const [
    simpleBanner,
    onSaleProducts,
    tripleImageItems,
    partnerBrands,
    highlightCards,
  ] = await Promise.all([
    getActiveSimpleBanner(),
    getOnSaleProducts(),
    getActiveTripleImageGrid(),
    getActivePartnerBrands(),
    getActiveHighlightCards(),
  ]);

  return (
    <>
      <Header />

      {/* 1. Banner sazonal — edge-to-edge */}
      <Suspense fallback={<BannerCarouselSkeleton />}>
        <BannerShowcase />
      </Suspense>

      <div className="space-y-12 py-6 md:space-y-16">
        {/* 2. Banner simples */}
        <SimpleBanner banner={simpleBanner} />

        {/* 3. Carrossel de promoções */}
        <PromoCarousel products={onSaleProducts} />

        {/* 4. Mais vendidos */}
        <Suspense fallback={<ProductCarouselSkeleton title="Mais vendidos" />}>
          <BestSellersSection />
        </Suspense>
      </div>

      {/* 5. Grade de 3 imagens — edge-to-edge */}
      <TripleImageGrid items={tripleImageItems} />

      <div className="space-y-12 py-6 md:space-y-16">
        {/* 6. Marcas parceiras — centralizado */}
        <BrandShowcase brands={partnerBrands} />

        {/* 7. Novidades */}
        <Suspense fallback={<ProductCarouselSkeleton title="Novidades" />}>
          <NewArrivalsSection />
        </Suspense>
      </div>

      {/* 8. Feature Highlight — tríade (edge-to-edge) */}
      <FeatureHighlight cards={highlightCards} />

      <div className="py-12" />
    </>
  );
};

export default Home;
