import { BannerCarousel } from "@/components/home/banner-carousel";
import { getActiveSeasonalBanners } from "@/lib/storefront-showcase";

export async function BannerShowcase() {
  const banners = await getActiveSeasonalBanners();

  return (
    <div className="px-5">
      <BannerCarousel banners={banners} />
    </div>
  );
}
