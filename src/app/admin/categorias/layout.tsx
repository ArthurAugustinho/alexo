import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminSession } from "@/lib/admin-auth";

type AdminCategoriesLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminCategoriesLayout({
  children,
}: AdminCategoriesLayoutProps) {
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
