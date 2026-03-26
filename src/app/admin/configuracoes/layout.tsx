import { LayoutTemplateIcon, MessageCircleIcon, Settings2Icon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getCurrentSessionWithRole,
  isAdminRole,
} from "@/lib/admin-auth";

type AdminConfiguracoesLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminConfiguracoesLayout({
  children,
}: AdminConfiguracoesLayoutProps) {
  const { session, user, role } = await getCurrentSessionWithRole();

  if (!session?.user) {
    redirect("/login");
  }

  if (!isAdminRole(role)) {
    redirect("/admin?error=access-denied");
  }

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
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge variant="outline" className="rounded-full px-3 py-1">
                <Settings2Icon className="size-3" />
                Configurações
              </Badge>
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold">Configurações da loja</h1>
                <p className="text-muted-foreground max-w-2xl">
                  Gerencie o conteúdo do footer, FAQ e redes sociais exibidos
                  na loja.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/admin/configuracoes/footer">
                  <Settings2Icon />
                  Footer
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/admin/configuracoes/atendimento">
                  <MessageCircleIcon />
                  Atendimento
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
