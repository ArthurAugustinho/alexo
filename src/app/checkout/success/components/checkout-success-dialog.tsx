"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

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
  imageUrl?: string | null;
};

export function CheckoutSuccessDialog({ orderId, imageUrl }: CheckoutSuccessDialogProps) {
  const [open, setOpen] = useState(true);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="text-center">
        <Image
          src={imageUrl || "/illustration.svg"}
          alt="Pagamento aprovado"
          width={300}
          height={300}
          className="mx-auto"
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
