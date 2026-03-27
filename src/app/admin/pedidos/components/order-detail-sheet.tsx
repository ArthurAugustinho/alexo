"use client";

import { ExternalLinkIcon } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCentsToBRL } from "@/helpers/money";
import type { AdminOrderRow } from "@/lib/queries/orders";

const STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando",
  paid: "Pago",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado",
  refunded: "Reembolsado",
};

type Props = {
  order: AdminOrderRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (order: AdminOrderRow) => void;
};

export function OrderDetailSheet({
  order,
  open,
  onOpenChange,
  onUpdateStatus,
}: Props) {
  if (!order) return null;

  const shortId = order.id.slice(0, 8).toUpperCase();
  const isTerminal =
    order.status === "delivered" || order.status === "refunded";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Pedido #{shortId}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="secondary">{STATUS_LABELS[order.status] ?? order.status}</Badge>
            <span className="text-muted-foreground text-xs">
              {order.createdAt.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <Separator />

          <div>
            <h4 className="mb-2 text-sm font-semibold">Cliente</h4>
            <p className="text-sm">{order.user.name}</p>
            <p className="text-muted-foreground text-xs">{order.user.email}</p>
          </div>

          <Separator />

          <div>
            <h4 className="mb-2 text-sm font-semibold">Itens</h4>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={item.variant.imageUrl}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium leading-snug">{item.product.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.variant.color} · {item.variant.size} · x{item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    {formatCentsToBRL(item.priceInCents * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-1 text-sm">
            {order.discountInCents != null && order.discountInCents > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Desconto{order.couponCode ? ` (${order.couponCode})` : ""}
                </span>
                <span className="text-green-600">
                  -{formatCentsToBRL(order.discountInCents)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCentsToBRL(order.totalPriceInCents)}</span>
            </div>
          </div>

          {(order.trackingCode || order.trackingUrl) && (
            <>
              <Separator />
              <div>
                <h4 className="mb-2 text-sm font-semibold">Rastreamento</h4>
                {order.trackingCode && (
                  <p className="font-mono text-sm">{order.trackingCode}</p>
                )}
                {order.trackingUrl && (
                  <Button variant="link" className="h-auto p-0 text-xs" asChild>
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Rastrear <ExternalLinkIcon className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}

          {order.statusNote && (
            <>
              <Separator />
              <div>
                <h4 className="mb-1 text-sm font-semibold">Nota interna</h4>
                <p className="text-muted-foreground text-sm">{order.statusNote}</p>
              </div>
            </>
          )}

          {!isTerminal && (
            <Button
              className="w-full"
              onClick={() => onUpdateStatus(order)}
            >
              Atualizar status
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
