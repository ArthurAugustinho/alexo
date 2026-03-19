import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminSession } from "@/lib/admin-auth";

type AdminProductsLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminProductsLayout({
  children,
}: AdminProductsLayoutProps) {
  const { user, role } = await requireAdminSession();

  return (
    <AdminShell
      user={{
        name: user?.name ?? "Admin",
        email: user?.email ?? "",
        image: user?.image,
      }}
      role={role}
    >
      {children}
    </AdminShell>
  );
}
