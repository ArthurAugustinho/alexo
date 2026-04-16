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

export function CheckoutPendingDialog() {
  const [open, setOpen] = useState(true);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="text-center">
        <LottieAnimation
          src="/animations/checkout-pending.json"
          width={280}
          height={280}
          loop={true}
        />
        <DialogTitle className="mt-4 text-2xl">
          Pagamento em análise
        </DialogTitle>
        <DialogDescription className="font-medium">
          Seu pagamento está sendo processado. Você receberá uma confirmação
          assim que for aprovado. Acompanhe o status em{" "}
          <strong>Meus Pedidos</strong>.
        </DialogDescription>

        <DialogFooter>
          <Button className="rounded-full" size="lg" asChild>
            <Link href="/my-orders">Ver meus pedidos</Link>
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
