import { BannerManagement } from "@/components/admin/banner-management";
import { getAdminBanners } from "@/lib/admin-showcase";

export default async function AdminStorefrontBannersPage() {
  const banners = await getAdminBanners();

  return <BannerManagement banners={banners} />;
}
