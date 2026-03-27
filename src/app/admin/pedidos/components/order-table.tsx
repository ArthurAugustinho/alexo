"use client";

import {
  ClockIcon,
  CreditCardIcon,
  PackageCheckIcon,
  RefreshCwIcon,
  TruckIcon,
  XCircleIcon,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCentsToBRL } from "@/helpers/money";
import type { AdminOrderRow } from "@/lib/queries/orders";

import { UpdateStatusDialog } from "./update-status-dialog";

type StatusTab = "all" | "pending" | "paid" | "shipped" | "delivered" | "canceled" | "refunded";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  pending: { label: "Aguardando", color: "bg-amber-100 text-amber-700", Icon: ClockIcon },
  paid: { label: "Pago", color: "bg-blue-100 text-blue-700", Icon: CreditCardIcon },
  shipped: { label: "Enviado", color: "bg-purple-100 text-purple-700", Icon: TruckIcon },
  delivered: { label: "Entregue", color: "bg-emerald-100 text-emerald-700", Icon: PackageCheckIcon },
  canceled: { label: "Cancelado", color: "bg-red-100 text-red-700", Icon: XCircleIcon },
  refunded: { label: "Reembolsado", color: "bg-gray-100 text-gray-600", Icon: RefreshCwIcon },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status];
  if (!config) return <span>{status}</span>;
  const { label, color, Icon } = config;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}

function filterByTab(orders: AdminOrderRow[], tab: StatusTab): AdminOrderRow[] {
  if (tab === "all") return orders;
  return orders.filter((o) => o.status === tab);
}

function searchOrders(orders: AdminOrderRow[], query: string): AdminOrderRow[] {
  if (!query.trim()) return orders;
  const q = query.toLowerCase();
  return orders.filter(
    (o) =>
      o.id.toLowerCase().includes(q) ||
      o.user.name.toLowerCase().includes(q) ||
      o.user.email.toLowerCase().includes(q),
  );
}

type Props = { orders: AdminOrderRow[] };

export function OrderTable({ orders }: Props) {
  const [tab, setTab] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRow | null>(null);

  const filtered = searchOrders(filterByTab(orders, tab), search);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar por ID, nome ou e-mail..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as StatusTab)}>
        <TabsList>
          <TabsTrigger value="all">Todos ({orders.length})</TabsTrigger>
          <TabsTrigger value="pending">Aguardando</TabsTrigger>
          <TabsTrigger value="paid">Pagos</TabsTrigger>
          <TabsTrigger value="shipped">Enviados</TabsTrigger>
          <TabsTrigger value="delivered">Entregues</TabsTrigger>
          <TabsTrigger value="canceled">Cancelados</TabsTrigger>
          <TabsTrigger value="refunded">Reembolsados</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Nenhum pedido encontrado.
            </p>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">ID</th>
                    <th className="px-4 py-3 text-left font-medium">Cliente</th>
                    <th className="px-4 py-3 text-left font-medium">Data</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{order.user.name}</p>
                        <p className="text-muted-foreground text-xs">{order.user.email}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {order.createdAt.toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCentsToBRL(order.totalPriceInCents)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedOrder(order)}
                          disabled={
                            order.status === "delivered" ||
                            order.status === "refunded"
                          }
                        >
                          Atualizar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedOrder && (
        <UpdateStatusDialog
          order={selectedOrder}
          open={!!selectedOrder}
          onOpenChange={(open) => {
            if (!open) setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
}
