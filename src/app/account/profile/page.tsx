"use client";

import { KeyRoundIcon, UserIcon } from "lucide-react";

import {
  PersonalDataTab,
  PreferencesTab,
  SecurityTab,
} from "@/components/common/profile-sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";

const ProfilePage = () => {
  const { data: session } = authClient.useSession();

  if (!session?.user?.id) return null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Meu cadastro</h1>
      <Tabs defaultValue="personal">
        <TabsList className="w-full">
          <TabsTrigger value="personal" className="flex-1 gap-1.5">
            <UserIcon className="size-3.5" />
            Dados
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1 gap-1.5">
            <KeyRoundIcon className="size-3.5" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex-1">
            Preferências
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-4">
          <PersonalDataTab userId={session.user.id} />
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <SecurityTab userId={session.user.id} />
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <PreferencesTab userId={session.user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
