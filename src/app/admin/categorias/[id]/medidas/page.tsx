import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SizeChartManager } from "@/components/admin/size-chart-manager";
import { Button } from "@/components/ui/button";
import { getSizeChartByCategory } from "@/lib/queries/size-charts";

type AdminCategoryMeasurementsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminCategoryMeasurementsPage({
  params,
}: AdminCategoryMeasurementsPageProps) {
  const { id } = await params;
  const data = await getSizeChartByCategory(id);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <section className="border-border/70 bg-background/95 rounded-3xl border p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Button asChild variant="ghost" className="w-fit rounded-xl px-0">
              <Link href="/admin/dashboard">
                <ArrowLeftIcon />
                Voltar ao dashboard
              </Link>
            </Button>

            <div className="space-y-1">
              <h1 className="text-3xl font-semibold">
                Medidas de {data.category.name}
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Cadastre a tabela de medidas usada para recomendar tamanhos na
                pagina do produto.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SizeChartManager
        categoryId={data.category.id}
        categoryName={data.category.name}
        entries={data.entries}
      />
    </div>
  );
}
