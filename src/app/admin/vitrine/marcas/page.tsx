import { getAllPartnerBrands } from "@/lib/queries/partner-brands";

import { BrandTable } from "./components/brand-table";

export default async function AdminVitrineMarcasPage() {
  const brands = await getAllPartnerBrands();

  return <BrandTable initialBrands={brands} />;
}
