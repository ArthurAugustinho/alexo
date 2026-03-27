"use server";

import { and, desc, eq } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";

import { db } from "@/db";
import { orderTable } from "@/db/schema";

export type OrderItemWithProduct = {
  id: string;
  quantity: number;
  priceInCents: number;
  variant: {
    color: string;
    size: string;
    imageUrl: string;
  };
  product: {
    name: string;
    slug: string;
  };
};

export type OrderReturnRequest = {
  id: string;
  status: "pending_review" | "approved" | "rejected" | "completed";
  reason: string;
  adminNote: string | null;
  returnCode: string | null;
  returnUrl: string | null;
  createdAt: Date;
} | null;

export type OrderWithItems = {
  id: string;
  status:
    | "pending"
    | "paid"
    | "shipped"
    | "delivered"
    | "canceled"
    | "refunded";
  totalPriceInCents: number;
  createdAt: Date;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  refundedAt: Date | null;
  canceledAt: Date | null;
  trackingCode: string | null;
  trackingUrl: string | null;
  statusNote: string | null;
  items: OrderItemWithProduct[];
  returnRequest: OrderReturnRequest;
};

export type AdminOrderRow = Omit<OrderWithItems, "returnRequest"> & {
  stripePaymentIntentId: string | null;
  discountInCents: number | null;
  couponCode: string | null;
  user: { name: string; email: string };
};

function mapReturnRequest(
  rr: {
    id: string;
    status: "pending_review" | "approved" | "rejected" | "completed";
    reason: "defect" | "wrong_item" | "damaged" | "wrong_size" | "other";
    adminNote: string | null;
    returnCode: string | null;
    returnUrl: string | null;
    createdAt: Date;
  } | null,
): OrderReturnRequest {
  if (!rr) return null;
  return {
    id: rr.id,
    status: rr.status,
    reason: rr.reason,
    adminNote: rr.adminNote,
    returnCode: rr.returnCode,
    returnUrl: rr.returnUrl,
    createdAt: rr.createdAt,
  };
}

function mapItems(
  items: Array<{
    id: string;
    quantity: number;
    priceInCents: number;
    productVariant: {
      color: string;
      size: string;
      imageUrl: string;
      product: { name: string; slug: string };
    };
  }>,
): OrderItemWithProduct[] {
  return items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    priceInCents: item.priceInCents,
    variant: {
      color: item.productVariant.color,
      size: item.productVariant.size,
      imageUrl: item.productVariant.imageUrl,
    },
    product: {
      name: item.productVariant.product.name,
      slug: item.productVariant.product.slug,
    },
  }));
}

export async function getOrdersByUser(
  userId: string,
): Promise<OrderWithItems[]> {
  noStore();

  const rows = await db.query.orderTable.findMany({
    where: eq(orderTable.userId, userId),
    orderBy: [desc(orderTable.createdAt)],
    with: {
      items: {
        with: {
          productVariant: {
            with: { product: { columns: { name: true, slug: true } } },
          },
        },
      },
      returnRequest: {
        columns: {
          id: true,
          status: true,
          reason: true,
          adminNote: true,
          returnCode: true,
          returnUrl: true,
          createdAt: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    totalPriceInCents: row.totalPriceInCents,
    createdAt: row.createdAt,
    shippedAt: row.shippedAt,
    deliveredAt: row.deliveredAt,
    refundedAt: row.refundedAt,
    canceledAt: row.canceledAt,
    trackingCode: row.trackingCode,
    trackingUrl: row.trackingUrl,
    statusNote: row.statusNote,
    items: mapItems(row.items),
    returnRequest: mapReturnRequest(row.returnRequest),
  }));
}

export async function getOrderById(
  orderId: string,
  userId: string,
): Promise<OrderWithItems | null> {
  noStore();

  const row = await db.query.orderTable.findFirst({
    where: and(eq(orderTable.id, orderId), eq(orderTable.userId, userId)),
    with: {
      items: {
        with: {
          productVariant: {
            with: { product: { columns: { name: true, slug: true } } },
          },
        },
      },
      returnRequest: {
        columns: {
          id: true,
          status: true,
          reason: true,
          adminNote: true,
          returnCode: true,
          returnUrl: true,
          createdAt: true,
        },
      },
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    status: row.status,
    totalPriceInCents: row.totalPriceInCents,
    createdAt: row.createdAt,
    shippedAt: row.shippedAt,
    deliveredAt: row.deliveredAt,
    refundedAt: row.refundedAt,
    canceledAt: row.canceledAt,
    trackingCode: row.trackingCode,
    trackingUrl: row.trackingUrl,
    statusNote: row.statusNote,
    items: mapItems(row.items),
    returnRequest: mapReturnRequest(row.returnRequest),
  };
}

export async function getAllOrdersForAdmin(): Promise<AdminOrderRow[]> {
  noStore();

  const rows = await db.query.orderTable.findMany({
    orderBy: [desc(orderTable.createdAt)],
    with: {
      user: { columns: { name: true, email: true } },
      items: {
        with: {
          productVariant: {
            with: { product: { columns: { name: true, slug: true } } },
          },
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    totalPriceInCents: row.totalPriceInCents,
    createdAt: row.createdAt,
    shippedAt: row.shippedAt,
    deliveredAt: row.deliveredAt,
    refundedAt: row.refundedAt,
    canceledAt: row.canceledAt,
    trackingCode: row.trackingCode,
    trackingUrl: row.trackingUrl,
    statusNote: row.statusNote,
    stripePaymentIntentId: row.stripePaymentIntentId,
    discountInCents: row.discountInCents,
    couponCode: row.couponCode,
    user: { name: row.user.name, email: row.user.email },
    items: mapItems(row.items),
  }));
}
