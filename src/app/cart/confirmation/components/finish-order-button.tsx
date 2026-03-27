"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFinishOrder } from "@/hooks/mutations/use-finish-order";
import { createCheckoutSession } from "@/lib/actions/checkout";

type Props = {
  shippingCostInCents: number;
  shippingNotSelected: boolean;
};

const FinishOrderButton = ({ shippingCostInCents, shippingNotSelected }: Props) => {
  const [errorDialogIsOpen, setErrorDialogIsOpen] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const finishOrderMutation = useFinishOrder();

  const handleFinishOrder = async () => {
    setErrorDialogIsOpen(false);
    try {
      const { orderId } = await finishOrderMutation.mutateAsync(shippingCostInCents);

      const sessionResult = await createCheckoutSession({ orderId });
      if (!sessionResult.success || !sessionResult.sessionUrl) {
        throw new Error(
          sessionResult.message ?? "Não foi possível iniciar o pagamento.",
        );
      }

      setIsRedirecting(true);
      window.location.href = sessionResult.sessionUrl;
    } catch (err) {
      console.error(err);
      setIsRedirecting(false);
      setErrorDialogIsOpen(true);
    }
  };

  return (
    <>
      {shippingNotSelected && (
        <p className="text-muted-foreground text-center text-xs">
          Calcule e selecione o frete para continuar
        </p>
      )}
      <Button
        className="w-full rounded-full"
        size="lg"
        onClick={handleFinishOrder}
        disabled={
          finishOrderMutation.isPending || isRedirecting || shippingNotSelected
        }
      >
        {(finishOrderMutation.isPending || isRedirecting) && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        {isRedirecting ? "Redirecionando..." : "Finalizar compra"}
      </Button>

      <Dialog open={errorDialogIsOpen} onOpenChange={setErrorDialogIsOpen}>
        <DialogContent className="text-center">
          <Image
            src="/illustration.svg"
            alt="Pagamento não confirmado"
            width={300}
            height={300}
            className="mx-auto"
          />
          <DialogTitle className="mt-4 text-2xl">
            Pagamento não confirmado
          </DialogTitle>
          <DialogDescription className="font-medium">
            Não conseguimos finalizar o pagamento. Tente novamente ou escolha
            outro método.
          </DialogDescription>

          <DialogFooter>
            <Button
              className="rounded-full"
              size="lg"
              onClick={() => {
                setErrorDialogIsOpen(false);
                handleFinishOrder();
              }}
            >
              Tentar novamente
            </Button>
            <Button
              className="rounded-full"
              variant="outline"
              size="lg"
              onClick={() => setErrorDialogIsOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FinishOrderButton;
