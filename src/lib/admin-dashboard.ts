import { db } from "@/db";

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

type TrendPoint = {
  label: string;
  value: number;
};

type BarPoint = {
  label: string;
  value: number;
  description?: string;
};

type FunnelPoint = {
  label: string;
  value: number;
};

type PiePoint = {
  label: string;
  value: number;
};

type ScatterPoint = {
  label: string;
  x: number;
  y: number;
  size: number;
};

type HeatmapCell = {
  label: string;
  value: number;
};

type HeatmapRow = {
  label: string;
  values: HeatmapCell[];
};

type StackedSegment = {
  label: string;
  value: number;
};

type StackedBarPoint = {
  label: string;
  segments: StackedSegment[];
};

export type DashboardChart<TData> = {
  title: string;
  description: string;
  data: TData;
  source: "real" | "estimated";
};

export type AdminDashboardData = {
  summary: {
    totalRevenueInCents: number;
    paidOrders: number;
    catalogSize: number;
  };
  revenueTrend: DashboardChart<TrendPoint[]>;
  topProducts: DashboardChart<BarPoint[]>;
  conversionFunnel: DashboardChart<FunnelPoint[]>;
  paymentMethods: DashboardChart<PiePoint[]>;
  averageTicketScatter: DashboardChart<ScatterPoint[]>;
  geoHeatmap: DashboardChart<HeatmapRow[]>;
  orderStatusBoard: DashboardChart<StackedBarPoint[]>;
  returnRateByCategory: DashboardChart<BarPoint[]>;
  logisticsFunnel: DashboardChart<FunnelPoint[]>;
};

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function subtractDays(date: Date, amount: number) {
  const value = new Date(date);
  value.setDate(value.getDate() - amount);
  return value;
}

function subtractMonths(date: Date, amount: number) {
  const value = new Date(date);
  value.setMonth(value.getMonth() - amount);
  return value;
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatMonthLabel(date: Date) {
  return `${MONTH_LABELS[date.getMonth()]}/${String(date.getFullYear()).slice(-2)}`;
}

function ensureTrendData(data: TrendPoint[], seed: number) {
  if (data.some((point) => point.value > 0)) {
    return data;
  }

  return data.map((point, index) => ({
    ...point,
    value: Math.max(0, Math.round(seed * (0.65 + index * 0.08))),
  }));
}

function ensureBarData(data: BarPoint[], fallbackLabels: string[], base: number) {
  if (data.some((point) => point.value > 0)) {
    return data;
  }

  return fallbackLabels.map((label, index) => ({
    label,
    value: Math.max(1, Math.round(base - index * (base * 0.12))),
  }));
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [orders, carts, products, categories] = await Promise.all([
    db.query.orderTable.findMany({
      with: {
        user: true,
        shippingAddress: true,
        items: {
          with: {
            productVariant: {
              with: {
                product: {
                  with: {
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    db.query.cartTable.findMany({
      with: {
        items: true,
      },
    }),
    db.query.productTable.findMany({
      with: {
        variants: true,
        category: true,
      },
    }),
    db.query.categoryTable.findMany({}),
  ]);

  const now = new Date();
  const paidOrders = orders.filter((order) => order.status === "paid");
  const totalRevenueInCents = paidOrders.reduce(
    (total, order) => total + order.totalPriceInCents,
    0,
  );

  const revenueTrendBase = Array.from({ length: 14 }, (_, index) => {
    const day = startOfDay(subtractDays(now, 13 - index));
    const value = paidOrders
      .filter(
        (order) => startOfDay(order.createdAt).getTime() === day.getTime(),
      )
      .reduce((total, order) => total + order.totalPriceInCents, 0);

    return {
      label: formatDayLabel(day),
      value: Math.round(value / 100),
    };
  });

  const revenueTrend = ensureTrendData(
    revenueTrendBase,
    Math.max(180, Math.round(products.length * 32)),
  );

  const soldByProduct = new Map<
    string,
    {
      label: string;
      description: string;
      value: number;
    }
  >();

  for (const order of paidOrders) {
    for (const item of order.items) {
      const product = item.productVariant.product;
      const category = product.category?.name ?? "Sem categoria";
      const current = soldByProduct.get(product.id) ?? {
        label: product.name,
        description: category,
        value: 0,
      };

      current.value += item.quantity;
      soldByProduct.set(product.id, current);
    }
  }

  const topProducts = ensureBarData(
    [...soldByProduct.values()]
      .sort((left, right) => right.value - left.value)
      .slice(0, 5),
    products.slice(0, 5).map((product) => product.name),
    48,
  );

  const visitsEstimate = Math.max(
    carts.length * 18,
    paidOrders.length * 12,
    orders.length * 8,
    320,
  );
  const cartEstimate = Math.max(carts.length * 6, Math.round(visitsEstimate * 0.24));
  const checkoutEstimate = Math.max(
    Math.round(cartEstimate * 0.54),
    paidOrders.length,
  );

  const conversionFunnel: FunnelPoint[] = [
    { label: "Visitas", value: visitsEstimate },
    { label: "Carrinho", value: cartEstimate },
    { label: "Checkout", value: checkoutEstimate },
  ];

  const paymentMethods: PiePoint[] =
    paidOrders.length > 0
      ? [
          { label: "Cart\u00e3o", value: Math.max(1, Math.round(paidOrders.length * 0.56)) },
          { label: "Pix", value: Math.max(1, Math.round(paidOrders.length * 0.31)) },
          { label: "Boleto", value: Math.max(1, Math.round(paidOrders.length * 0.13)) },
        ]
      : [
          { label: "Cart\u00e3o", value: 56 },
          { label: "Pix", value: 31 },
          { label: "Boleto", value: 13 },
        ];

  const customerTickets = new Map<
    string,
    { label: string; ticket: number; ordersCount: number; size: number }
  >();

  for (const order of paidOrders) {
    const current = customerTickets.get(order.userId) ?? {
      label: order.user.name.split(" ")[0] ?? "Cliente",
      ticket: 0,
      ordersCount: 0,
      size: 0,
    };

    current.ticket += order.totalPriceInCents / 100;
    current.ordersCount += 1;
    current.size += order.items.reduce((total, item) => total + item.quantity, 0);
    customerTickets.set(order.userId, current);
  }

  const averageTicketScatter =
    customerTickets.size > 0
      ? [...customerTickets.values()].map((entry) => ({
          label: entry.label,
          x: entry.ordersCount,
          y: Math.round(entry.ticket / entry.ordersCount),
          size: Math.max(8, entry.size * 2),
        }))
      : Array.from({ length: 5 }, (_, index) => ({
          label: `Cliente ${index + 1}`,
          x: index + 1,
          y: 120 + index * 38,
          size: 12 + index * 4,
        }));

  const monthBuckets = Array.from({ length: 4 }, (_, index) => {
    const bucketDate = subtractMonths(now, 3 - index);
    return {
      key: getMonthKey(bucketDate),
      label: formatMonthLabel(bucketDate),
    };
  });

  const stateBuckets = new Map<string, number[]>();

  for (const order of orders) {
    const state = order.state || order.shippingAddress?.state || "N/D";
    const monthIndex = monthBuckets.findIndex(
      (bucket) => bucket.key === getMonthKey(order.createdAt),
    );

    if (monthIndex === -1) {
      continue;
    }

    const currentRow =
      stateBuckets.get(state) ?? Array.from({ length: monthBuckets.length }, () => 0);
    currentRow[monthIndex] += 1;
    stateBuckets.set(state, currentRow);
  }

  const geoHeatmapRows =
    stateBuckets.size > 0
      ? [...stateBuckets.entries()]
          .sort(
            (left, right) =>
              right[1].reduce((sum, value) => sum + value, 0) -
              left[1].reduce((sum, value) => sum + value, 0),
          )
          .slice(0, 5)
          .map(([state, values]) => ({
            label: state,
            values: values.map((value, index) => ({
              label: monthBuckets[index]?.label ?? "",
              value,
            })),
          }))
      : ["SP", "RJ", "MG", "PR", "BA"].map((state, rowIndex) => ({
          label: state,
          values: monthBuckets.map((bucket, columnIndex) => ({
            label: bucket.label,
            value: (rowIndex + 1) * (columnIndex + 2),
          })),
        }));

  const weeklyLabels = Array.from({ length: 4 }, (_, index) => ({
    label: `S${index + 1}`,
    start: subtractDays(now, 27 - index * 7),
    end: subtractDays(now, 20 - index * 7),
  }));

  const orderStatusBoardBase = weeklyLabels.map((bucket) => {
    let pending = 0;
    let separating = 0;
    let sent = 0;

    for (const order of orders) {
      if (order.createdAt < bucket.start || order.createdAt > bucket.end) {
        continue;
      }

      if (order.status === "pending") {
        pending += 1;
        continue;
      }

      if (order.status !== "paid") {
        continue;
      }

      const ageInDays = Math.floor(
        (now.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (ageInDays <= 2) {
        separating += 1;
      } else {
        sent += 1;
      }
    }

    return {
      label: bucket.label,
      segments: [
        { label: "Aguardando Pagamento", value: pending },
        { label: "Em Separa\u00e7\u00e3o", value: separating },
        { label: "Enviados", value: sent },
      ],
    };
  });

  const orderStatusBoard = orderStatusBoardBase.some((entry) =>
    entry.segments.some((segment) => segment.value > 0),
  )
    ? orderStatusBoardBase
    : weeklyLabels.map((bucket, index) => ({
        label: bucket.label,
        segments: [
          { label: "Aguardando Pagamento", value: 4 + index },
          { label: "Em Separa\u00e7\u00e3o", value: 7 + index * 2 },
          { label: "Enviados", value: 12 + index * 3 },
        ],
      }));

  const soldByCategory = new Map<string, { sold: number; canceled: number }>();

  for (const order of orders) {
    for (const item of order.items) {
      const categoryName =
        item.productVariant.product.category?.name ?? "Sem categoria";
      const current = soldByCategory.get(categoryName) ?? {
        sold: 0,
        canceled: 0,
      };

      current.sold += item.quantity;

      if (order.status === "canceled") {
        current.canceled += item.quantity;
      }

      soldByCategory.set(categoryName, current);
    }
  }

  const returnRateByCategory =
    soldByCategory.size > 0
      ? [...soldByCategory.entries()]
          .map(([label, totals]) => ({
            label,
            value:
              totals.sold === 0
                ? 0
                : Math.round((totals.canceled / totals.sold) * 100),
          }))
          .sort((left, right) => right.value - left.value)
          .slice(0, 5)
      : categories.slice(0, 5).map((category, index) => ({
          label: category.name,
          value: 2 + index * 2,
        }));

  // O funil log\u00edstico usa a idade do pedido pago como proxy de avan\u00e7o
  // operacional porque o schema atual ainda n\u00e3o persiste eventos de last mile.
  const confirmedOrders = paidOrders.length + orders.filter((order) => order.status === "pending").length;
  const dispatchedOrders = paidOrders.filter((order) => {
    const ageInDays =
      (now.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return ageInDays >= 1;
  }).length;
  const inTransitOrders = paidOrders.filter((order) => {
    const ageInDays =
      (now.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return ageInDays >= 3;
  }).length;
  const deliveredOrders = paidOrders.filter((order) => {
    const ageInDays =
      (now.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return ageInDays >= 7;
  }).length;

  const logisticsFunnel =
    confirmedOrders > 0
      ? [
          { label: "Pedido Confirmado", value: confirmedOrders },
          { label: "Despachado", value: Math.max(0, dispatchedOrders) },
          { label: "Em Tr\u00e2nsito", value: Math.max(0, inTransitOrders) },
          { label: "Entregue", value: Math.max(0, deliveredOrders) },
        ]
      : [
          { label: "Pedido Confirmado", value: 340 },
          { label: "Despachado", value: 282 },
          { label: "Em Tr\u00e2nsito", value: 224 },
          { label: "Entregue", value: 196 },
        ];

  return {
    summary: {
      totalRevenueInCents,
      paidOrders: paidOrders.length,
      catalogSize: products.length,
    },
    revenueTrend: {
      title: "Faturamento",
      description: "Curva dos \u00faltimos 14 dias com leitura de sazonalidade do caixa.",
      data: revenueTrend,
      source: paidOrders.length > 0 ? "real" : "estimated",
    },
    topProducts: {
      title: "Produtos Mais Vendidos",
      description: "Ranking por produto com leitura de categoria mais forte.",
      data: topProducts,
      source: paidOrders.length > 0 ? "real" : "estimated",
    },
    conversionFunnel: {
      title: "Taxa de Convers\u00e3o",
      description: "Leitura de visita at\u00e9 checkout com base em carrinhos e pedidos.",
      data: conversionFunnel,
      source: "estimated",
    },
    paymentMethods: {
      title: "Meios de Pagamento",
      description: "Distribui\u00e7\u00e3o estimada para cart\u00e3o, Pix e boleto.",
      data: paymentMethods,
      source: "estimated",
    },
    averageTicketScatter: {
      title: "Ticket M\u00e9dio por Cliente",
      description: "Quantidade de pedidos versus ticket individual por comprador.",
      data: averageTicketScatter,
      source: paidOrders.length > 0 ? "real" : "estimated",
    },
    geoHeatmap: {
      title: "Geolocaliza\u00e7\u00e3o das Compras",
      description: "Mapa de calor por estado e m\u00eas com base no endere\u00e7o de entrega.",
      data: geoHeatmapRows,
      source: orders.length > 0 ? "real" : "estimated",
    },
    orderStatusBoard: {
      title: "Status de Pedidos",
      description:
        "Fila operacional das \u00faltimas semanas entre pagamento, separa\u00e7\u00e3o e envio.",
      data: orderStatusBoard,
      source: orders.length > 0 ? "real" : "estimated",
    },
    returnRateByCategory: {
      title: "Taxa de Devolu\u00e7\u00e3o",
      description:
        "Proxy por categoria a partir da rela\u00e7\u00e3o entre itens vendidos e cancelados.",
      data: returnRateByCategory,
      source: "estimated",
    },
    logisticsFunnel: {
      title: "Funil de Log\u00edstica",
      description: "Proje\u00e7\u00e3o do fluxo confirmado at\u00e9 a entrega no last mile.",
      data: logisticsFunnel,
      source: "estimated",
    },
  };
}
