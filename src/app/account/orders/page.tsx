"use client";

import { ShoppingBagIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { OrderCard } from "@/components/orders/order-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrders } from "@/hooks/queries/use-orders";
import { authClient } from "@/lib/auth-client";
import type { OrderWithItems } from "@/lib/queries/orders";

type FilterTab = "all" | "active" | "completed" | "canceled";

function filterOrders(
  orders: OrderWithItems[],
  tab: FilterTab,
): OrderWithItems[] {
  switch (tab) {
    case "active":
      return orders.filter((o) =>
        ["pending", "paid", "shipped"].includes(o.status),
      );
    case "completed":
      return orders.filter((o) => o.status === "delivered");
    case "canceled":
      return orders.filter((o) =>
        ["canceled", "refunded"].includes(o.status),
      );
    default:
      return orders;
  }
}

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3 rounded-2xl border p-4">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex justify-between gap-2">
            {[1, 2, 3, 4].map((j) => (
              <Skeleton key={j} className="size-8 rounded-full" />
            ))}
          </div>
          <div className="flex gap-3">
            <Skeleton className="size-14 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="bg-muted flex size-16 items-center justify-center rounded-full">
        <ShoppingBagIcon className="text-muted-foreground size-7" />
      </div>
      <div>
        <p className="font-semibold">Nenhum pedido ainda</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Você ainda não fez nenhum pedido.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/">Explorar produtos</Link>
      </Button>
    </div>
  );
}

const OrdersPage = () => {
  const { data: session } = authClient.useSession();
  const { data: orders = [], isLoading } = useOrders(session?.user?.id);
  const [tab, setTab] = useState<FilterTab>("all");

  const filtered = filterOrders(orders, tab);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Meus pedidos</h1>
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as FilterTab)}
      >
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1 text-xs">
            Todos
          </TabsTrigger>
          <TabsTrigger value="active" className="flex-1 text-xs">
            Em andamento
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 text-xs">
            Concluídos
          </TabsTrigger>
          <TabsTrigger value="canceled" className="flex-1 text-xs">
            Cancelados
          </TabsTrigger>
        </TabsList>

        {(["all", "active", "completed", "canceled"] as FilterTab[]).map(
          (tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="mt-4">
              {isLoading ? (
                <OrdersSkeleton />
              ) : filtered.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-4">
                  {filtered.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </TabsContent>
          ),
        )}
      </Tabs>
    </div>
  );
};

export default OrdersPage;
