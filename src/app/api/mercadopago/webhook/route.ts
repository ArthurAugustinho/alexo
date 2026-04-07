import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { orderTable } from "@/db/schema";
import { payment } from "@/lib/mercadopago";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      type?: string;
      data?: { id?: string };
    };

    // Ignorar notificações que não são de pagamento
    if (body.type !== "payment" || !body.data?.id) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const paymentId = body.data.id;
    const paymentData = await payment.get({ id: paymentId });

    const orderId = paymentData.external_reference;
    const status = paymentData.status;

    if (!orderId) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (status === "approved") {
      await db
        .update(orderTable)
        .set({
          status: "paid",
          mpPaymentId: String(paymentId),
        })
        .where(eq(orderTable.id, orderId));
    } else if (status === "cancelled" || status === "rejected") {
      await db
        .update(orderTable)
        .set({ status: "canceled" })
        .where(eq(orderTable.id, orderId));
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch {
    // Sempre retornar 200 para o MP não reenviar
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
