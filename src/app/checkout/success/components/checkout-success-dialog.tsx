"use client";

import Link from "next/link";
import { useState } from "react";

import { LottieAnimation } from "@/components/checkout/lottie-animation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

type CheckoutSuccessDialogProps = {
  orderId?: string;
};

export function CheckoutSuccessDialog({ orderId }: CheckoutSuccessDialogProps) {
  const [open, setOpen] = useState(true);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="text-center">
        <LottieAnimation
          src="/animations/checkout-success.json"
          width={280}
          height={280}
          loop={false}
        />
        <DialogTitle className="mt-4 text-2xl">Pagamento aprovado!</DialogTitle>
        <DialogDescription className="font-medium">
          {orderId
            ? `Pedido ${orderId} confirmado. Você pode acompanhar o status em "Meus Pedidos".`
            : 'Seu pagamento foi confirmado. Você pode acompanhar o status em "Meus Pedidos".'}
        </DialogDescription>

        <DialogFooter>
          <Button className="rounded-full" size="lg" asChild>
            <Link href="/account/orders">Ver meus pedidos</Link>
          </Button>
          <Button
            className="rounded-full"
            variant="outline"
            size="lg"
            asChild
          >
            <Link href="/">Voltar para a loja</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
