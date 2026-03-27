export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import {
  getCurrentSessionWithRole,
  isAdminRole,
} from "@/lib/admin-auth";
import { getAllReturnRequests } from "@/lib/queries/return-requests";

import { ReturnTable } from "./components/return-table";

export default async function AdminDevolucoesPage() {
  const { session, user, role } = await getCurrentSessionWithRole();

  if (!session?.user) {
    redirect("/login");
  }

  if (!isAdminRole(role)) {
    redirect("/admin?error=access-denied");
  }

  const requests = await getAllReturnRequests();

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
          <h2 className="text-2xl font-bold">Devoluções</h2>
          <p className="text-muted-foreground text-sm">
            {requests.length} solicitaç{requests.length !== 1 ? "ões" : "ão"} no total
          </p>
        </div>

        <ReturnTable requests={requests} />
      </div>
    </AdminShell>
  );
}
