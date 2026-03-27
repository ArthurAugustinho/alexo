import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/db";
import { orderTable } from "@/db/schema";

export const POST = async (request: Request) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.error();
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.error();
  }
  const text = await request.text();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      text,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (!orderId) break;

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null);

      await db
        .update(orderTable)
        .set({
          status: "paid",
          ...(paymentIntentId && { stripePaymentIntentId: paymentIntentId }),
        })
        .where(eq(orderTable.id, orderId));
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : (charge.payment_intent?.id ?? null);

      if (!paymentIntentId) break;

      const refundedOrder = await db.query.orderTable.findFirst({
        where: eq(orderTable.stripePaymentIntentId, paymentIntentId),
        columns: { id: true },
      });
      if (!refundedOrder) break;

      await db
        .update(orderTable)
        .set({ status: "refunded", refundedAt: new Date() })
        .where(eq(orderTable.id, refundedOrder.id));

      revalidatePath("/");
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const failedOrder = await db.query.orderTable.findFirst({
        where: eq(orderTable.stripePaymentIntentId, paymentIntent.id),
        columns: { id: true },
      });
      if (!failedOrder) break;

      await db
        .update(orderTable)
        .set({ status: "canceled", canceledAt: new Date() })
        .where(eq(orderTable.id, failedOrder.id));

      revalidatePath("/");
      break;
    }
  }

  return NextResponse.json({ received: true });
};
