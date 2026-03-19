import { desc } from "drizzle-orm";

import { AdminDashboardGrid } from "@/components/admin/admin-dashboard-grid";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  type AdminCatalogCategory,
  CategoryManagement,
  ProductManagement,
} from "@/components/admin/product-management";
import { db } from "@/db";
import { categoryTable, productTable } from "@/db/schema";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAdminDashboardData } from "@/lib/admin-dashboard";

async function getCatalogByCategory(): Promise<AdminCatalogCategory[]> {
  const categories = await db.query.categoryTable.findMany({
    orderBy: [categoryTable.name],
    with: {
      products: {
        orderBy: [desc(productTable.createdAt)],
        with: {
          variants: true,
        },
      },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    products: category.products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      categoryId: category.id,
      slug: product.slug,
      shippingCostInCents: product.shippingCostInCents,
      variantsCount: product.variants.length,
      primaryVariant: product.variants[0]
        ? {
            id: product.variants[0].id,
            name: product.variants[0].name,
            color: product.variants[0].color,
            priceInCents: product.variants[0].priceInCents,
            imageUrl: product.variants[0].imageUrl,
          }
        : null,
    })),
  }));
}

export default async function AdminDashboardPage() {
  const [{ user, role }, analytics, categories] = await Promise.all([
    requireAdminSession(),
    getAdminDashboardData(),
    getCatalogByCategory(),
  ]);

  const dashboardRole = role === "super_admin" ? "super_admin" : "admin";
  const dashboardCharts = [
    analytics.revenueTrend,
    analytics.topProducts,
    analytics.conversionFunnel,
    analytics.paymentMethods,
    analytics.averageTicketScatter,
    analytics.geoHeatmap,
    analytics.orderStatusBoard,
    analytics.returnRateByCategory,
    analytics.logisticsFunnel,
  ];
  const hasEstimatedMetrics = dashboardCharts.some(
    (metric) => metric.source === "estimated",
  );

  return (
    <AdminShell
      user={{
        name: user?.name ?? "Admin",
        email: user?.email ?? "",
        image: user?.image,
      }}
      role={role}
    >
      <div className="space-y-8">
        <section className="space-y-2">
          {/* Auditoria de fontes em src/lib/admin-dashboard.ts:
              - Reais: summary.totalRevenueInCents, summary.paidOrders, summary.catalogSize.
              - Condicionalmente reais: revenueTrend, topProducts, averageTicketScatter,
                geoHeatmap e orderStatusBoard quando há dados suficientes no banco.
              - Condicionalmente estimadas: revenueTrend, topProducts,
                averageTicketScatter, geoHeatmap e orderStatusBoard quando entram em fallback.
              - Estimadas: conversionFunnel, paymentMethods, returnRateByCategory
                e logisticsFunnel por dependerem de proxy, inferência ou distribuição simulada.
          */}
          <p className="text-muted-foreground text-sm">
            Visão consolidada de vendas, comportamento de compra, operação e
            catálogo.
          </p>
          {hasEstimatedMetrics ? (
            <div
              role="note"
              className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-[13px] text-amber-900"
            >
              Métricas marcadas com Est. são estimativas. Dados reais são
              calculados dos pedidos.
            </div>
          ) : null}
          <AdminDashboardGrid analytics={analytics} />
        </section>

        <section>
          <CategoryManagement categories={categories} role={dashboardRole} />
        </section>

        <section>
          <ProductManagement categories={categories} role={dashboardRole} />
        </section>
      </div>
    </AdminShell>
  );
}
