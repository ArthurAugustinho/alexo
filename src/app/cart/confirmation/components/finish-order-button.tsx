"use client";

import { loadStripe } from "@stripe/stripe-js";
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

const FinishOrderButton = () => {
  const [errorDialogIsOpen, setErrorDialogIsOpen] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const finishOrderMutation = useFinishOrder();

  const handleFinishOrder = async () => {
    setErrorDialogIsOpen(false);
    try {
      if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        throw new Error("Stripe publishable key is not set");
      }

      const { orderId } = await finishOrderMutation.mutateAsync();

      const checkoutSession = await createCheckoutSession({ orderId });

      const stripe = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      );

      if (!stripe || !checkoutSession.id) {
        throw new Error("Payment provider not available");
      }

      setIsRedirecting(true);

      const { error } = await stripe.redirectToCheckout({
        sessionId: checkoutSession.id,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      console.error(err);
      setIsRedirecting(false);
      setErrorDialogIsOpen(true);
    }
  };

  return (
    <>
      <Button
        className="w-full rounded-full"
        size="lg"
        onClick={handleFinishOrder}
        disabled={finishOrderMutation.isPending || isRedirecting}
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
