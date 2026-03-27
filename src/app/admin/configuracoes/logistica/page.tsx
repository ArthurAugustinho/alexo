import { LogisticsConfigForm } from "@/components/admin/logistics-config-form";
import { getLogisticsConfig } from "@/lib/queries/logistics";

export const dynamic = "force-dynamic";

export default async function AdminLogisticaPage() {
  const config = await getLogisticsConfig();

  return <LogisticsConfigForm config={config} />;
}
