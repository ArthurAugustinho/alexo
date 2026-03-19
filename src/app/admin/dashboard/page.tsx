import { asc, desc } from "drizzle-orm";

import { AdminDashboardGrid } from "@/components/admin/admin-dashboard-grid";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  type AdminCatalogCategory,
  CategoryManagement,
  ProductManagement,
} from "@/components/admin/product-management";
import { db } from "@/db";
import { categoryTable, productSizeTable, productTable, productVariantTable } from "@/db/schema";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAdminDashboardData } from "@/lib/admin-dashboard";

export const dynamic = "force-dynamic";

async function getCatalogByCategory(): Promise<AdminCatalogCategory[]> {
  const categories = await db.query.categoryTable.findMany({
    orderBy: [categoryTable.name],
    with: {
      products: {
        orderBy: [desc(productTable.createdAt)],
        with: {
          productSizes: {
            orderBy: [asc(productSizeTable.position)],
          },
          variants: {
            orderBy: [asc(productVariantTable.createdAt)],
          },
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
      sizeType: product.sizeType,
      productSizes: product.productSizes,
      shippingCostInCents: product.shippingCostInCents,
      variantsCount: product.variants.length,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        color: variant.color,
        size: variant.size,
        stock: variant.stock,
        imageUrl: variant.imageUrl,
      })),
      primaryVariant: product.variants[0]
        ? {
            id: product.variants[0].id,
            name: product.variants[0].name,
            color: product.variants[0].color,
            size: product.variants[0].size,
            stock: product.variants[0].stock,
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
          <p className="text-muted-foreground text-sm">
            Visão consolidada de vendas, comportamento de compra, operação e
            catálogo.
          </p>
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
