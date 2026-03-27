import { desc } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { orderTable } from "@/db/schema";
import { isAdminRole } from "@/lib/admin-auth";
import { auth } from "@/lib/auth";

const STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando",
  paid: "Pago",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado",
  refunded: "Reembolsado",
};

function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (!isAdminRole(session.user.role as string)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const orders = await db.query.orderTable.findMany({
    orderBy: [desc(orderTable.createdAt)],
    with: {
      user: { columns: { name: true, email: true } },
      items: {
        with: {
          productVariant: {
            with: { product: { columns: { name: true } } },
          },
        },
      },
    },
  });

  const headerRow = [
    "ID",
    "Data",
    "Cliente",
    "E-mail",
    "Status",
    "Total (R$)",
    "Desconto (R$)",
    "Cupom",
    "Código de rastreio",
    "Itens",
  ].join(",");

  const rows = orders.map((order) => {
    const itemsSummary = order.items
      .map((i) => `${i.productVariant.product.name} x${i.quantity}`)
      .join("; ");

    return [
      escapeCsvField(order.id),
      escapeCsvField(
        order.createdAt.toLocaleDateString("pt-BR"),
      ),
      escapeCsvField(order.user.name),
      escapeCsvField(order.user.email),
      escapeCsvField(STATUS_LABELS[order.status] ?? order.status),
      escapeCsvField(
        (order.totalPriceInCents / 100).toFixed(2).replace(".", ","),
      ),
      escapeCsvField(
        ((order.discountInCents ?? 0) / 100).toFixed(2).replace(".", ","),
      ),
      escapeCsvField(order.couponCode ?? ""),
      escapeCsvField(order.trackingCode ?? ""),
      escapeCsvField(itemsSummary),
    ].join(",");
  });

  const csv = [headerRow, ...rows].join("\n");
  const bom = "\uFEFF";

  return new NextResponse(bom + csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pedidos-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
