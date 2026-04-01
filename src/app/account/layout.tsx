import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AccountMobileTabs } from "@/components/account/account-mobile-tabs";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { Header } from "@/components/common/header";
import { auth } from "@/lib/auth";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <>
      <Header />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex gap-8">
          <aside className="hidden w-64 shrink-0 md:block">
            <AccountSidebar />
          </aside>
          <main className="min-w-0 flex-1">
            <div className="md:hidden">
              <AccountMobileTabs />
            </div>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
