"use client";

import { PackageIcon, ShoppingBagIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { OrderCard } from "@/components/orders/order-card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrders } from "@/hooks/queries/use-orders";
import type { OrderWithItems } from "@/lib/queries/orders";

type FilterTab = "all" | "active" | "completed" | "canceled";

function filterOrders(orders: OrderWithItems[], tab: FilterTab): OrderWithItems[] {
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
        <div key={i} className="rounded-2xl border p-4 space-y-3">
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

function EmptyState({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  function handleExplore() {
    onClose();
    router.push("/");
  }

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
      <Button onClick={handleExplore} variant="outline">
        Explorar produtos
      </Button>
    </div>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
};

export function OrdersSheet({ open, onOpenChange, userId }: Props) {
  const { data: orders = [], isLoading } = useOrders(userId);
  const [tab, setTab] = useState<FilterTab>("all");

  const filtered = filterOrders(orders, tab);

  const activeCount = orders.filter((o) =>
    ["pending", "paid", "shipped"].includes(o.status),
  ).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <PackageIcon className="size-4" />
            Meus pedidos
            {activeCount > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs font-medium">
                {activeCount}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="px-1 pb-6">
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as FilterTab)}
            className="mt-4"
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
                    <EmptyState onClose={() => onOpenChange(false)} />
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
      </SheetContent>
    </Sheet>
  );
}
