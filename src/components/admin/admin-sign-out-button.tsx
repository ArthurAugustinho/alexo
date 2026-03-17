"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type AdminSignOutButtonProps = {
  variant?: "default" | "outline" | "secondary" | "ghost";
};

export function AdminSignOutButton({
  variant = "outline",
}: AdminSignOutButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/admin");
            router.refresh();
          },
          onError: () => {
            toast.error("N\u00e3o foi poss\u00edvel encerrar a sess\u00e3o.");
          },
        },
      });
    });
  };

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleSignOut}
      disabled={isPending}
    >
      <LogOutIcon />
      Sair
    </Button>
  );
}
