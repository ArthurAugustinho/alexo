"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ClipboardIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  MailIcon,
  MapPinIcon,
  TruckIcon,
  UserIcon,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCentsToBRL } from "@/helpers/money";
import {
  type AdminOrderRow,
  getOrderDetailById,
} from "@/lib/queries/orders";

import { UpdateStatusDialog } from "./update-status-dialog";

export const getAdminOrderDetailQueryKey = (orderId: string | null) => [
  "admin-order-detail",
  orderId,
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: {
    label: "Aguardando pagamento",
    color: "bg-amber-100 text-amber-700",
  },
  paid: { label: "Pago", color: "bg-blue-100 text-blue-700" },
  shipped: { label: "Enviado", color: "bg-purple-100 text-purple-700" },
  delivered: { label: "Entregue", color: "bg-emerald-100 text-emerald-700" },
  canceled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
  refunded: { label: "Reembolsado", color: "bg-gray-100 text-gray-600" },
};

type Props = {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: () => void;
};

export function OrderDetailSheet({
  orderId,
  open,
  onOpenChange,
  onUpdateStatus,
}: Props) {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: getAdminOrderDetailQueryKey(orderId),
    queryFn: () => getOrderDetailById(orderId!),
    enabled: !!orderId,
  });

  const isTerminal =
    order?.status === "delivered" || order?.status === "refunded";

  const updateOrderForDialog: AdminOrderRow | null = order
    ? {
        id: order.id,
        status: order.status,
        totalPriceInCents: order.totalPriceInCents,
        createdAt: order.createdAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        refundedAt: order.refundedAt,
        canceledAt: order.canceledAt,
        trackingCode: order.trackingCode,
        trackingUrl: order.trackingUrl,
        statusNote: order.statusNote,
        stripePaymentIntentId: order.stripePaymentIntentId,
        discountInCents: order.discountInCents,
        couponCode: order.couponCode,
        user: order.user,
        items: order.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          priceInCents: item.priceInCents,
          variant: item.variant,
          product: {
            id: "",
            name: item.variant.product.name,
            slug: item.variant.product.slug,
          },
        })),
      }
    : null;

  function copyAddress() {
    if (!order) return;
    const parts = [
      order.recipientName,
      `${order.street}, ${order.number}`,
      order.complement ?? null,
      order.neighborhood,
      `${order.city} - ${order.state}`,
      `CEP ${order.zipCode}`,
    ].filter(Boolean);
    navigator.clipboard.writeText(parts.join(", "));
    toast.success("Endereço copiado!");
  }

  function copyStripeId() {
    if (!order?.stripePaymentIntentId) return;
    navigator.clipboard.writeText(order.stripePaymentIntentId);
    toast.success("ID copiado!");
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>
              {order
                ? `Pedido #${order.id.slice(0, 8).toUpperCase()}`
                : "Detalhes do pedido"}
            </SheetTitle>
            {order && (
              <p className="text-muted-foreground text-xs">
                {order.createdAt.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}{" "}
                às{" "}
                {order.createdAt.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </SheetHeader>

          {isLoading ? (
            <div className="mt-6 space-y-4 px-1">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : order ? (
            <div className="mt-6 space-y-6">
              {/* STATUS */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                    Status atual
                  </p>
                  {(() => {
                    const cfg = STATUS_CONFIG[order.status];
                    return (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg?.color ?? ""}`}
                      >
                        {cfg?.label ?? order.status}
                      </span>
                    );
                  })()}
                  {order.shippedAt && (
                    <p className="text-muted-foreground text-xs">
                      Enviado em {order.shippedAt.toLocaleDateString("pt-BR")}
                    </p>
                  )}
                  {order.deliveredAt && (
                    <p className="text-muted-foreground text-xs">
                      Entregue em{" "}
                      {order.deliveredAt.toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
                {!isTerminal && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowUpdateDialog(true)}
                  >
                    Atualizar status
                  </Button>
                )}
              </div>

              <Separator />

              {/* CLIENTE */}
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <UserIcon className="text-muted-foreground size-4" />
                  <h4 className="text-sm font-semibold">Cliente</h4>
                </div>
                <p className="text-sm font-medium">{order.user.name}</p>
                <a
                  href={`mailto:${order.user.email}`}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
                >
                  <MailIcon className="size-3" />
                  {order.user.email}
                </a>
              </div>

              <Separator />

              {/* ENDEREÇO */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MapPinIcon className="text-muted-foreground size-4" />
                    <h4 className="text-sm font-semibold">
                      Endereço de entrega
                    </h4>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 text-xs"
                    onClick={copyAddress}
                  >
                    <ClipboardIcon className="size-3" />
                    Copiar
                  </Button>
                </div>
                <div className="space-y-0.5 text-sm">
                  <p className="font-medium">{order.recipientName}</p>
                  <p className="text-muted-foreground text-xs">{order.phone}</p>
                  <p>
                    {order.street}, {order.number}
                    {order.complement ? ` - ${order.complement}` : ""}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {order.neighborhood} · {order.city} - {order.state}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    CEP: {order.zipCode}
                  </p>
                </div>
              </div>

              <Separator />

              {/* ITENS */}
              <div>
                <h4 className="mb-3 text-sm font-semibold">Itens do pedido</h4>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={item.variant.imageUrl}
                          alt={item.variant.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug">
                          {item.variant.product.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {item.variant.color} · {item.variant.size} · x
                          {item.quantity}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-medium">
                        {formatCentsToBRL(item.priceInCents * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* VALORES */}
              <div>
                <h4 className="mb-2 text-sm font-semibold">Valores</h4>
                <div className="space-y-1.5 text-sm">
                  {order.originalTotalInCents != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>
                        {formatCentsToBRL(order.originalTotalInCents)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frete</span>
                    <span>{formatCentsToBRL(order.shippingCostInCents)}</span>
                  </div>
                  {order.discountInCents > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Desconto
                        {order.couponCode ? ` (${order.couponCode})` : ""}
                      </span>
                      <span className="text-green-600">
                        -{formatCentsToBRL(order.discountInCents)}
                      </span>
                    </div>
                  )}
                  <Separator className="my-1" />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCentsToBRL(order.totalPriceInCents)}</span>
                  </div>
                </div>
              </div>

              {/* PAGAMENTO */}
              {order.stripePaymentIntentId && (
                <>
                  <Separator />
                  <div>
                    <div className="mb-2 flex items-center gap-1.5">
                      <CreditCardIcon className="text-muted-foreground size-4" />
                      <h4 className="text-sm font-semibold">Pagamento</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground truncate font-mono text-xs">
                        {order.stripePaymentIntentId}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 shrink-0"
                        onClick={copyStripeId}
                      >
                        <ClipboardIcon className="size-3" />
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* RASTREAMENTO */}
              {(order.status === "shipped" ||
                order.status === "delivered") && (
                <>
                  <Separator />
                  <div>
                    <div className="mb-2 flex items-center gap-1.5">
                      <TruckIcon className="text-muted-foreground size-4" />
                      <h4 className="text-sm font-semibold">Rastreamento</h4>
                    </div>
                    {order.trackingCode ? (
                      <div className="space-y-1">
                        <p className="font-mono text-sm">
                          {order.trackingCode}
                        </p>
                        {order.trackingUrl && (
                          <Button
                            variant="link"
                            className="h-auto p-0 text-xs"
                            asChild
                          >
                            <a
                              href={order.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Rastrear nos Correios{" "}
                              <ExternalLinkIcon className="ml-1 size-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-xs">
                        Código de rastreamento não informado. Atualize o status
                        para adicionar.
                      </p>
                    )}
                  </div>
                </>
              )}

              {order.statusNote && (
                <>
                  <Separator />
                  <div>
                    <h4 className="mb-1 text-sm font-semibold">
                      Nota interna
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      {order.statusNote}
                    </p>
                  </div>
                </>
              )}

              {!isTerminal && (
                <Button
                  className="w-full"
                  onClick={() => setShowUpdateDialog(true)}
                >
                  Atualizar status do pedido
                </Button>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {showUpdateDialog && updateOrderForDialog && (
        <UpdateStatusDialog
          order={updateOrderForDialog}
          open={showUpdateDialog}
          onOpenChange={(open) => {
            setShowUpdateDialog(open);
            if (!open) onUpdateStatus();
          }}
        />
      )}
    </>
  );
}
