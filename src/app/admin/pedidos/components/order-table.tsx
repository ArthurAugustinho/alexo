"use client";

import {
  CheckSquareIcon,
  ClockIcon,
  CreditCardIcon,
  DownloadIcon,
  PackageCheckIcon,
  RefreshCwIcon,
  TruckIcon,
  XCircleIcon,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { bulkUpdateOrderStatus } from "@/actions/bulk-update-order-status";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCentsToBRL } from "@/helpers/money";
import type { AdminOrderRow } from "@/lib/queries/orders";

import { OrderDetailSheet } from "./order-detail-sheet";
import { UpdateStatusDialog } from "./update-status-dialog";

const PAGE_SIZE = 20;

type StatusTab =
  | "all"
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "canceled"
  | "refunded";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: {
    label: "Aguardando",
    color: "bg-amber-100 text-amber-700",
    Icon: ClockIcon,
  },
  paid: {
    label: "Pago",
    color: "bg-blue-100 text-blue-700",
    Icon: CreditCardIcon,
  },
  shipped: {
    label: "Enviado",
    color: "bg-purple-100 text-purple-700",
    Icon: TruckIcon,
  },
  delivered: {
    label: "Entregue",
    color: "bg-emerald-100 text-emerald-700",
    Icon: PackageCheckIcon,
  },
  canceled: {
    label: "Cancelado",
    color: "bg-red-100 text-red-700",
    Icon: XCircleIcon,
  },
  refunded: {
    label: "Reembolsado",
    color: "bg-gray-100 text-gray-600",
    Icon: RefreshCwIcon,
  },
};

const BULK_STATUS_OPTIONS = [
  { value: "shipped", label: "Marcar como Enviado" },
  { value: "delivered", label: "Marcar como Entregue" },
  { value: "canceled", label: "Marcar como Cancelado" },
] as const;

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

type Props = { orders: AdminOrderRow[] };

export function OrderTable({ orders }: Props) {
  const [tab, setTab] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailOrder, setDetailOrder] = useState<AdminOrderRow | null>(null);
  const [updateOrder, setUpdateOrder] = useState<AdminOrderRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const o of orders) {
      c[o.status] = (c[o.status] ?? 0) + 1;
    }
    return c;
  }, [orders]);

  const totalRevenue = useMemo(
    () =>
      orders
        .filter((o) => o.status !== "canceled" && o.status !== "refunded")
        .reduce((sum, o) => sum + o.totalPriceInCents, 0),
    [orders],
  );

  const filtered = useMemo(() => {
    let list = tab === "all" ? orders : orders.filter((o) => o.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.user.name.toLowerCase().includes(q) ||
          o.user.email.toLowerCase().includes(q),
      );
    }
    return list;
  }, [orders, tab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allPageSelected =
    paginated.length > 0 && paginated.every((o) => selected.has(o.id));

  const handleTabChange = (value: string) => {
    setTab(value as StatusTab);
    setPage(1);
    setSelected(new Set());
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    setSelected(new Set());
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePage = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        paginated.forEach((o) => next.add(o.id));
      } else {
        paginated.forEach((o) => next.delete(o.id));
      }
      return next;
    });
  };

  const handleBulkUpdate = (
    status: "shipped" | "delivered" | "canceled" | "refunded",
  ) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    startTransition(async () => {
      const result = await bulkUpdateOrderStatus({ orderIds: ids, status });
      if (result.success) {
        toast.success(result.message);
        setSelected(new Set());
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-xs">Receita total</p>
          <p className="text-lg font-bold">{formatCentsToBRL(totalRevenue)}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-xs">Pagos</p>
          <p className="text-lg font-bold text-blue-600">
            {(counts["paid"] ?? 0) + (counts["shipped"] ?? 0) + (counts["delivered"] ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-xs">Em trânsito</p>
          <p className="text-lg font-bold text-purple-600">
            {counts["shipped"] ?? 0}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-xs">Aguardando</p>
          <p className="text-lg font-bold text-amber-600">
            {counts["pending"] ?? 0}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por ID, nome ou e-mail..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-xs"
        />
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <a href="/api/admin/orders/export" download>
            <DownloadIcon className="mr-1 h-4 w-4" />
            Exportar CSV
          </a>
        </Button>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2">
          <CheckSquareIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {selected.size} selecionado{selected.size !== 1 ? "s" : ""}
          </span>
          <div className="ml-auto flex gap-2">
            {BULK_STATUS_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleBulkUpdate(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelected(new Set())}
            >
              Limpar
            </Button>
          </div>
        </div>
      )}

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">Todos ({orders.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Aguardando ({counts["pending"] ?? 0})
          </TabsTrigger>
          <TabsTrigger value="paid">Pagos ({counts["paid"] ?? 0})</TabsTrigger>
          <TabsTrigger value="shipped">
            Enviados ({counts["shipped"] ?? 0})
          </TabsTrigger>
          <TabsTrigger value="delivered">
            Entregues ({counts["delivered"] ?? 0})
          </TabsTrigger>
          <TabsTrigger value="canceled">
            Cancelados ({counts["canceled"] ?? 0})
          </TabsTrigger>
          <TabsTrigger value="refunded">
            Reembolsados ({counts["refunded"] ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Nenhum pedido encontrado.
            </p>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="w-10 px-4 py-3">
                        <Checkbox
                          checked={allPageSelected}
                          onCheckedChange={togglePage}
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-medium">ID</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Data</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginated.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-muted/20 cursor-pointer transition-colors"
                        onClick={() => {
                          setDetailOrder(order);
                        }}
                      >
                        <td
                          className="px-4 py-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(order.id);
                          }}
                        >
                          <Checkbox checked={selected.has(order.id)} />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{order.user.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {order.user.email}
                          </p>
                        </td>
                        <td className="text-muted-foreground px-4 py-3">
                          {order.createdAt.toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCentsToBRL(order.totalPriceInCents)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td
                          className="px-4 py-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setUpdateOrder(order)}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-muted-foreground text-xs">
                    {filtered.length} pedidos · página {page} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Anterior
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <OrderDetailSheet
        order={detailOrder}
        open={!!detailOrder}
        onOpenChange={(open) => {
          if (!open) setDetailOrder(null);
        }}
        onUpdateStatus={(order) => {
          setDetailOrder(null);
          setUpdateOrder(order);
        }}
      />

      {updateOrder && (
        <UpdateStatusDialog
          order={updateOrder}
          open={!!updateOrder}
          onOpenChange={(open) => {
            if (!open) setUpdateOrder(null);
          }}
        />
      )}
    </div>
  );
}
