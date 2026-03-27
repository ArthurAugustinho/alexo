import { StarIcon } from "lucide-react";
import { redirect } from "next/navigation";

import { AdminReviewsTable } from "@/components/admin/admin-reviews-table";
import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import {
  getCurrentSessionWithRole,
  isAdminRole,
} from "@/lib/admin-auth";
import { getAllReviewsForAdmin } from "@/lib/queries/reviews";

export const dynamic = "force-dynamic";

export default async function AdminAvaliacoesPage() {
  const { session, user, role } = await getCurrentSessionWithRole();

  if (!session?.user) {
    redirect("/login");
  }

  if (!isAdminRole(role)) {
    redirect("/admin?error=access-denied");
  }

  const reviews = await getAllReviewsForAdmin();
  const pending = reviews.filter((r) => !r.isApproved).length;

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
        <section className="border-border/70 bg-background/95 rounded-3xl border p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge variant="outline" className="rounded-full px-3 py-1">
                <StarIcon className="size-3" />
                Avaliações
              </Badge>
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold">
                  Avaliações de clientes
                </h1>
                <p className="text-muted-foreground max-w-2xl">
                  Modere as avaliações dos clientes antes de publicá-las na
                  loja.
                </p>
              </div>
            </div>

            {pending > 0 && (
              <Badge className="self-start text-sm">
                {pending} pendente{pending !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </section>

        <AdminReviewsTable reviews={reviews} />
      </div>
    </AdminShell>
  );
}
