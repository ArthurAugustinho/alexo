export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import {
  getCurrentSessionWithRole,
  isAdminRole,
} from "@/lib/admin-auth";
import { getAllOrdersForAdmin } from "@/lib/queries/orders";

import { OrderTable } from "./components/order-table";

export default async function AdminPedidosPage() {
  const { session, user, role } = await getCurrentSessionWithRole();

  if (!session?.user) {
    redirect("/login");
  }

  if (!isAdminRole(role)) {
    redirect("/admin?error=access-denied");
  }

  const orders = await getAllOrdersForAdmin();

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
          <h2 className="text-2xl font-bold">Pedidos</h2>
          <p className="text-muted-foreground text-sm">
            {orders.length} pedido{orders.length !== 1 ? "s" : ""} no total
          </p>
        </div>

        <OrderTable orders={orders} />
      </div>
    </AdminShell>
  );
}
