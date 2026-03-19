import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getVariantsByProductId } from "@/lib/queries/variants";

import { VariantForm } from "./_components/variant-form";
import { VariantTable } from "./_components/variant-table";

type AdminProductVariantsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminProductVariantsPage({
  params,
}: AdminProductVariantsPageProps) {
  const { id } = await params;
  const data = await getVariantsByProductId(id);

  if (!data) {
    notFound();
  }

  const availableVariantsCount = data.variants.filter(
    (variant) => variant.isAvailable,
  ).length;

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
                Variantes de {data.product.name}
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Gerencie cor, tamanho, imagem e disponibilidade de compra para
                cada variante sem impactar os registros históricos já
                cadastrados.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full px-3 py-1">
              {data.variants.length} variantes
            </Badge>
            <Badge className="rounded-full px-3 py-1">
              {availableVariantsCount} disponíveis
            </Badge>
            <VariantForm mode="create" productId={data.product.id} />
          </div>
        </div>
      </section>

      <VariantTable productId={data.product.id} variants={data.variants} />
    </div>
  );
}
