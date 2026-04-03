"use client";

import {
  CheckCircleIcon,
  CreditCardIcon,
  PackageCheckIcon,
  ShoppingBagIcon,
  TruckIcon,
  XCircleIcon,
} from "lucide-react";
import type { ComponentType } from "react";

import type { OrderWithItems } from "@/lib/queries/orders";

type TimelineStep = {
  key: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  completedAt: Date | null;
  extraInfo?: string | null;
  extraUrl?: string | null;
};

function buildSteps(order: OrderWithItems): TimelineStep[] {
  const paidAt =
    order.status !== "pending" && order.status !== "canceled"
      ? order.createdAt
      : null;

  return [
    {
      key: "pending",
      label: "Pedido realizado",
      Icon: ShoppingBagIcon,
      completedAt: order.createdAt,
    },
    {
      key: "paid",
      label: "Pagamento confirmado",
      Icon: CreditCardIcon,
      completedAt: paidAt,
    },
    {
      key: "shipped",
      label: "Enviado",
      Icon: TruckIcon,
      completedAt: order.shippedAt,
      extraInfo: order.trackingCode,
      extraUrl: order.trackingUrl,
    },
    {
      key: "delivered",
      label: "Entregue",
      Icon: PackageCheckIcon,
      completedAt: order.deliveredAt,
    },
  ];
}

type Props = { order: OrderWithItems };

export function OrderTimeline({ order }: Props) {
  if (order.status === "canceled") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2 text-red-700">
          <XCircleIcon className="size-4 shrink-0" />
          <span className="text-sm font-semibold">Pedido cancelado</span>
        </div>
        {order.canceledAt && (
          <p className="text-muted-foreground mt-1 text-xs">
            {order.canceledAt.toLocaleDateString("pt-BR")} às{" "}
            {order.canceledAt.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
        {order.statusNote && (
          <p className="mt-2 text-xs text-red-600">{order.statusNote}</p>
        )}
      </div>
    );
  }

  if (order.status === "refunded") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2 text-amber-700">
          <CheckCircleIcon className="size-4 shrink-0" />
          <span className="text-sm font-semibold">Reembolso processado</span>
        </div>
        {order.refundedAt && (
          <p className="text-muted-foreground mt-1 text-xs">
            {order.refundedAt.toLocaleDateString("pt-BR")} às{" "}
            {order.refundedAt.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
        {order.statusNote && (
          <p className="mt-2 text-xs text-amber-600">{order.statusNote}</p>
        )}
      </div>
    );
  }

  const steps = buildSteps(order);
  const completedCount = steps.filter((s) => s.completedAt !== null).length;

  return (
    <div className="space-y-1">
      <div className="flex items-start gap-0">
        {steps.map((step, index) => {
          const isCompleted = step.completedAt !== null;
          const isActive =
            !isCompleted && index === completedCount;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.key} className="flex flex-1 flex-col items-center">
              {/* Icon + connector line */}
              <div className="flex w-full items-center">
                {/* Left connector */}
                {index > 0 && (
                  <div
                    className={`h-0.5 flex-1 ${
                      isCompleted || steps[index - 1]?.completedAt
                        ? "bg-emerald-500"
                        : "border-t-2 border-dashed border-muted"
                    }`}
                  />
                )}

                {/* Icon circle */}
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    isCompleted
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : isActive
                        ? "border-primary bg-background text-primary animate-pulse"
                        : "border-muted bg-muted text-muted-foreground"
                  }`}
                >
                  <step.Icon className="size-3.5" />
                </div>

                {/* Right connector */}
                {!isLast && (
                  <div
                    className={`h-0.5 flex-1 ${
                      isCompleted
                        ? "bg-emerald-500"
                        : "border-t-2 border-dashed border-muted"
                    }`}
                  />
                )}
              </div>

              {/* Label */}
              <p
                className={`mt-1.5 text-center text-[10px] leading-tight ${
                  isCompleted
                    ? "font-medium text-emerald-700"
                    : isActive
                      ? "font-medium text-primary"
                      : "text-muted-foreground"
                }`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

    </div>
  );
}
