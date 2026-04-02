import { BannerCarousel } from "@/components/home/banner-carousel";
import { getActiveSeasonalBanners } from "@/lib/storefront-showcase";

export async function BannerShowcase() {
  const banners = await getActiveSeasonalBanners();

  return (
    <div className="w-full overflow-hidden">
      <BannerCarousel banners={banners} />
    </div>
  );
}
