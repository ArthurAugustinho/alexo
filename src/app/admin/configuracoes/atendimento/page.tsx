import { getSupportWidgetConfigRaw } from "@/lib/queries/support-widget";

import { SupportWidgetConfigForm } from "./components/support-widget-config-form";

export default async function AdminConfiguracoesAtendimentoPage() {
  const config = await getSupportWidgetConfigRaw();

  return <SupportWidgetConfigForm initialConfig={config} />;
}
