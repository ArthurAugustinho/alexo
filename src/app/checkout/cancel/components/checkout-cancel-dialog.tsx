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

type CheckoutCancelDialogProps = {
  orderId?: string;
  imageUrl?: string | null;
};

export function CheckoutCancelDialog({ orderId, imageUrl }: CheckoutCancelDialogProps) {
  const [open, setOpen] = useState(true);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="text-center">
        <Image
          src={imageUrl || "/illustration.svg"}
          alt="Pagamento não confirmado"
          width={300}
          height={300}
          className="mx-auto"
        />
        <DialogTitle className="mt-4 text-2xl">
          Pagamento não confirmado
        </DialogTitle>
        <DialogDescription className="font-medium">
          {orderId
            ? `Não conseguimos confirmar o pagamento do pedido ${orderId}.`
            : "Não conseguimos confirmar o pagamento."}{" "}
          Você pode tentar novamente ou voltar para a loja.
        </DialogDescription>

        <DialogFooter>
          <Button className="rounded-full" size="lg" asChild>
            <Link href="/">Tentar novamente</Link>
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
