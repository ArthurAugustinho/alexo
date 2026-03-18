import { ImageIcon, LayoutTemplateIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getCurrentSessionWithRole,
  isSuperAdminRole,
} from "@/lib/admin-auth";

type AdminStorefrontLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminStorefrontLayout({
  children,
}: AdminStorefrontLayoutProps) {
  const { session, user, role } = await getCurrentSessionWithRole();

  if (!session?.user) {
    redirect("/login");
  }

  if (!isSuperAdminRole(role)) {
    redirect("/admin?error=vitrine-restricted");
  }

  return (
    <AdminShell
      user={{
        name: user?.name ?? "Super Admin",
        email: user?.email ?? "",
        image: user?.image,
      }}
      role={role}
    >
      <div className="space-y-8">
        <section className="border-border/70 bg-background/95 rounded-3xl border p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge className="rounded-full px-3 py-1">
                Área exclusiva do Super Admin
              </Badge>
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold">Gestão da vitrine</h1>
                <p className="text-muted-foreground max-w-2xl">
                  Controle manual dos banners sazonais e da curadoria de
                  produtos em destaque exibidos na home da loja.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/admin/vitrine/banners">
                  <ImageIcon />
                  Banners
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/admin/vitrine/mais-vendidos">
                  <SparklesIcon />
                  Mais vendidos
                </Link>
              </Button>
              <Button asChild variant="ghost" className="rounded-xl">
                <Link href="/admin/dashboard">
                  <LayoutTemplateIcon />
                  Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {children}
      </div>
    </AdminShell>
  );
}
