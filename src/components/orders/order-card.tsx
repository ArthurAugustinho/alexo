"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircleIcon,
  ClockIcon,
  ExternalLinkIcon,
  XCircleIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { useState } from "react";
import { toast } from "sonner";

import { cancelReturnRequest } from "@/actions/cancel-return-request";
import { Button } from "@/components/ui/button";
import { formatCentsToBRL } from "@/helpers/money";
import type { OrderWithItems } from "@/lib/queries/orders";

import { OrderTimeline } from "./order-timeline";
import { ReturnRequestDialog } from "./return-request-dialog";

type Props = { order: OrderWithItems };

export function OrderCard({ order }: Props) {
  const shortId = order.id.slice(0, 8).toUpperCase();
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  function handleCancelReturn() {
    if (!order.returnRequest) return;
    startTransition(async () => {
      const result = await cancelReturnRequest({
        returnRequestId: order.returnRequest!.id,
      });
      if (result.success) {
        toast.success(result.message);
        void queryClient.invalidateQueries({ queryKey: ["orders"] });
      } else {
        toast.error(result.message);
      }
    });
  }

  const rr = order.returnRequest;

  return (
    <div className="rounded-2xl border p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm">Pedido #{shortId}</p>
          <p className="text-muted-foreground text-xs">
            {order.createdAt.toLocaleDateString("pt-BR")} às{" "}
            {order.createdAt.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <p className="font-bold text-sm shrink-0">
          {formatCentsToBRL(order.totalPriceInCents)}
        </p>
      </div>

      {/* Timeline */}
      <OrderTimeline order={order} />

      {/* Items */}
      <div className="space-y-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border">
              <Image
                src={item.variant.imageUrl}
                alt={item.product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.product.name}</p>
              <p className="text-muted-foreground text-xs">
                {item.variant.color} · {item.variant.size} · {item.quantity}x
              </p>
            </div>
            <p className="shrink-0 text-sm font-medium">
              {formatCentsToBRL(item.priceInCents * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      {/* Return request section */}
      {order.status === "delivered" && !rr && (
        <div className="pt-1">
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setReturnDialogOpen(true)}
          >
            ↩ Solicitar devolução
          </Button>
        </div>
      )}

      {rr?.status === "pending_review" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
            <ClockIcon className="size-4 shrink-0" />
            Devolução em análise
          </div>
          <p className="text-xs text-amber-600">
            Sua solicitação foi recebida e está sendo analisada.
          </p>
          <button
            type="button"
            onClick={handleCancelReturn}
            disabled={isPending}
            className="text-xs text-amber-700 underline underline-offset-2 hover:no-underline disabled:opacity-50"
          >
            {isPending ? "Cancelando..." : "Cancelar solicitação"}
          </button>
        </div>
      )}

      {rr?.status === "approved" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <CheckCircleIcon className="size-4 shrink-0" />
            Devolução aprovada
          </div>
          {rr.adminNote && (
            <p className="text-xs text-emerald-700">{rr.adminNote}</p>
          )}
          {rr.returnCode && (
            <p className="text-xs text-emerald-700">
              <span className="font-medium">Código de postagem:</span>{" "}
              {rr.returnCode}
            </p>
          )}
          {rr.returnUrl && (
            <Link
              href={rr.returnUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-emerald-700 underline underline-offset-2 hover:no-underline"
            >
              Ver instruções de postagem
              <ExternalLinkIcon className="size-3" />
            </Link>
          )}
        </div>
      )}

      {rr?.status === "rejected" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-destructive">
            <XCircleIcon className="size-4 shrink-0" />
            Devolução não aprovada
          </div>
          {rr.adminNote && (
            <p className="text-xs text-destructive/80">{rr.adminNote}</p>
          )}
        </div>
      )}

      {rr?.status === "completed" && (
        <div className="rounded-xl border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CheckCircleIcon className="size-4 shrink-0" />
            Devolução concluída
          </div>
        </div>
      )}

      {/* Footer link */}
      <Link
        href={`/my-orders`}
        className="text-primary flex items-center text-xs hover:underline"
      >
        Ver histórico completo →
      </Link>

      <ReturnRequestDialog
        order={order}
        open={returnDialogOpen}
        onOpenChange={setReturnDialogOpen}
      />
    </div>
  );
}
