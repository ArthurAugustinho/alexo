export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import {
  getCurrentSessionWithRole,
  isAdminRole,
} from "@/lib/admin-auth";
import { getAllCategories } from "@/lib/queries/categories";
import { getAllCoupons } from "@/lib/queries/coupons";

import { CouponTable } from "./components/coupon-table";

export default async function AdminCuponsPage() {
  const { session, user, role } = await getCurrentSessionWithRole();

  if (!session?.user) {
    redirect("/login");
  }

  if (!isAdminRole(role)) {
    redirect("/admin?error=access-denied");
  }

  const [coupons, categories] = await Promise.all([
    getAllCoupons(),
    getAllCategories(),
  ]);

  return (
    <AdminShell
      user={{
        name: user?.name ?? "Admin",
        email: user?.email ?? "",
        image: user?.image,
      }}
      role={role}
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Cupons</h2>
          <p className="text-muted-foreground text-sm">
            {coupons.length} cupom{coupons.length !== 1 ? "ns" : ""} cadastrado{coupons.length !== 1 ? "s" : ""}
          </p>
        </div>

        <CouponTable coupons={coupons} categories={categories} />
      </div>
    </AdminShell>
  );
}
