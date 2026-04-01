"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircleIcon,
  ClockIcon,
  ExternalLinkIcon,
  PackageIcon,
  XCircleIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useTransition } from "react";
import { toast } from "sonner";

import { cancelReturnRequest } from "@/actions/cancel-return-request";
import { Button } from "@/components/ui/button";
import { formatCentsToBRL } from "@/helpers/money";
import type { OrderWithItems } from "@/lib/queries/orders";

import { OrderTimeline } from "./order-timeline";
import { ReturnRequestDialog } from "./return-request-dialog";
import { ReviewButton } from "./review-button";
import { TrackingTimeline } from "./tracking-timeline";

type Props = {
  order: OrderWithItems;
  reviewedProductIds?: string[];
};

export function OrderCard({ order, reviewedProductIds = [] }: Props) {
  const shortId = order.id.slice(0, 8).toUpperCase();
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [trackingExpanded, setTrackingExpanded] = useState(false);
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
  const isDelivered = order.status === "delivered";
  const hasTracking = Boolean(order.trackingCode);

  return (
    <div className="space-y-4 rounded-2xl border p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Pedido #{shortId}</p>
          <p className="text-muted-foreground text-xs">
            {order.createdAt.toLocaleDateString("pt-BR")} às{" "}
            {order.createdAt.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <p className="shrink-0 text-sm font-bold">
          {formatCentsToBRL(order.totalPriceInCents)}
        </p>
      </div>

      {/* Timeline */}
      <OrderTimeline order={order} />

      {/* Tracking */}
      {hasTracking && (
        <div className="rounded-xl border px-3 py-2">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 text-sm font-medium"
            onClick={() => setTrackingExpanded((v) => !v)}
          >
            <span className="flex items-center gap-2">
              <PackageIcon className="size-4 shrink-0" />
              Rastreamento
              {order.trackingCode && (
                <span className="text-muted-foreground font-normal">
                  {order.trackingCode}
                </span>
              )}
            </span>
            <span className="text-muted-foreground text-xs">
              {trackingExpanded ? "Ocultar" : "Ver"}
            </span>
          </button>

          {trackingExpanded && order.trackingCode && (
            <TrackingTimeline trackingCode={order.trackingCode} />
          )}

          {order.trackingUrl && (
            <Link
              href={order.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs underline underline-offset-2 hover:no-underline"
            >
              Rastrear no site dos Correios
              <ExternalLinkIcon className="size-3" />
            </Link>
          )}
        </div>
      )}

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
            <div className="flex shrink-0 flex-col items-end gap-1">
              <p className="text-sm font-medium">
                {formatCentsToBRL(item.priceInCents * item.quantity)}
              </p>
              {isDelivered && (
                <ReviewButton
                  productId={item.product.id}
                  productName={item.product.name}
                  hasReviewed={reviewedProductIds.includes(item.product.id)}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Return request section */}
      {isDelivered && !rr && (
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
        <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
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
        <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
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
        <div className="space-y-1 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
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
        href="/account/orders"
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
