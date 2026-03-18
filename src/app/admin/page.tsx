import { redirect } from "next/navigation";

import { AccessRestricted } from "@/components/admin/access-restricted";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AdminRegisterForm } from "@/components/admin/admin-register-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getCurrentSessionWithRole,
  isAdminRegistrationConfigured,
  isAdminRole,
  isSuperAdminRole,
} from "@/lib/admin-auth";

type AdminPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function getAlertMessage(error?: string) {
  if (error === "access-denied") {
    return "A conta autenticada não possui permissão para acessar a administração.";
  }

  if (error === "vitrine-restricted") {
    return "A área de gestão da vitrine é exclusiva para o perfil Super Admin.";
  }

  return undefined;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [{ error }, sessionData] = await Promise.all([
    searchParams,
    getCurrentSessionWithRole(),
  ]);

  if (sessionData.session?.user && isAdminRole(sessionData.role)) {
    if (error === "vitrine-restricted" && !isSuperAdminRole(sessionData.role)) {
      return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_30%),linear-gradient(180deg,_#faf8ff,_#f4f1fb)]">
          <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-6 sm:px-6 lg:px-8">
            <AccessRestricted description={getAlertMessage(error) ?? ""} />
          </div>
        </div>
      );
    }

    redirect("/admin/dashboard");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_30%),linear-gradient(180deg,_#faf8ff,_#f4f1fb)]">
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-6 sm:px-6 lg:px-8">
        <section className="flex w-full items-center">
          <div className="w-full">
            <Tabs defaultValue="sign-in" className="space-y-4">
              <TabsList className="grid h-12 w-full grid-cols-2 rounded-2xl bg-background/90 p-1 shadow-sm">
                <TabsTrigger value="sign-in" className="rounded-xl">
                  Login
                </TabsTrigger>
                <TabsTrigger value="sign-up" className="rounded-xl">
                  Cadastro de vendedor
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sign-in" className="mt-0">
                <AdminLoginForm alertMessage={getAlertMessage(error)} />
              </TabsContent>
              <TabsContent value="sign-up" className="mt-0">
                <AdminRegisterForm
                  registrationEnabled={isAdminRegistrationConfigured()}
                />
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>
    </div>
  );
}
