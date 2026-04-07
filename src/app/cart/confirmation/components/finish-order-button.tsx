"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { createMpPreference } from "@/actions/create-mp-preference";
import { Button } from "@/components/ui/button";

const FinishOrderButton = () => {
  const [isPending, startTransition] = useTransition();

  const handleFinishOrder = () => {
    startTransition(async () => {
      const result = await createMpPreference();
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      window.location.href = result.initPoint;
    });
  };

  return (
    <Button
      className="w-full rounded-full"
      size="lg"
      onClick={handleFinishOrder}
      disabled={isPending}
    >
      {isPending ? "Processando..." : "Finalizar compra"}
    </Button>
  );
};

export default FinishOrderButton;
