import Link from "next/link";

import { AdminSignOutButton } from "@/components/admin/admin-sign-out-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminRoleLabel } from "@/lib/admin-auth";
import { type UserRole } from "@/lib/admin-roles";

type AdminShellProps = {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  role: UserRole;
};

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

export function AdminShell({ children, user, role }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(155,92,255,0.14),_transparent_32%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(246,243,255,0.92))]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="border-border/70 bg-background/85 sticky top-4 z-20 mb-6 rounded-3xl border px-4 py-4 shadow-sm backdrop-blur sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-lg font-semibold text-primary">
                A
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-[0.24em]">
                  Alexo Commerce
                </p>
                <h1 className="text-xl font-semibold">Admin Dashboard</h1>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="border-border/70 bg-muted/40 flex items-center gap-3 rounded-2xl border px-3 py-2">
                <Avatar>
                  <AvatarImage src={user.image ?? undefined} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>

                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-muted-foreground text-xs">{user.email}</p>
                </div>

                <Badge variant={role === "super_admin" ? "default" : "secondary"}>
                  {getAdminRoleLabel(role)}
                </Badge>
              </div>

              <div className="flex gap-2">
                {role === "super_admin" ? (
                  <Button asChild variant="outline">
                    <Link href="/admin/vitrine/banners">Vitrine</Link>
                  </Button>
                ) : null}
                <Button asChild variant="ghost">
                  <Link href="/">Ver loja</Link>
                </Button>
                <AdminSignOutButton />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
