import { getAllSimpleBanners } from "@/lib/queries/simple-banner";

import { SimpleBannerTable } from "./components/simple-banner-table";

export default async function AdminVitrineBannerSimplesPage() {
  const banners = await getAllSimpleBanners();

  return <SimpleBannerTable initialBanners={banners} />;
}
