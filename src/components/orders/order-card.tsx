"use client";

import Image from "next/image";
import Link from "next/link";

import { formatCentsToBRL } from "@/helpers/money";
import type { OrderWithItems } from "@/lib/queries/orders";

import { OrderTimeline } from "./order-timeline";

type Props = { order: OrderWithItems };

export function OrderCard({ order }: Props) {
  const shortId = order.id.slice(0, 8).toUpperCase();

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

      {/* Footer link */}
      <Link
        href={`/my-orders`}
        className="text-primary flex items-center text-xs hover:underline"
      >
        Ver histórico completo →
      </Link>
    </div>
  );
}
