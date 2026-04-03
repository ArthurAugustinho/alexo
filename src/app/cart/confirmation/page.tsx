import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Header } from "@/components/common/header";
import { db } from "@/db";
import { auth } from "@/lib/auth";

import { ConfirmationClient } from "./components/confirmation-client";

const ConfirmationPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user.id) {
    redirect("/");
  }
  const cart = await db.query.cartTable.findFirst({
    where: (cart, { eq }) => eq(cart.userId, session.user.id),
    with: {
      shippingAddress: true,
      items: {
        with: {
          productVariant: {
            with: {
              product: true,
            },
          },
        },
      },
    },
  });
  if (!cart || cart?.items.length === 0) {
    redirect("/");
  }
  if (!cart.shippingAddress) {
    redirect("/cart/identification");
  }

  const subtotalInCents = cart.items.reduce(
    (acc, item) =>
      acc +
      item.productVariant.priceInCents * item.quantity +
      (item.customizationExtraInCents ?? 0),
    0,
  );
  const storedShippingInCents = cart.items.reduce(
    (acc, item) => acc + (item.shippingCostInCents ?? 0),
    0,
  );

  return (
    <div>
      <Header />
      <div className="px-5 pb-8">
        <ConfirmationClient
          subtotalInCents={subtotalInCents}
          storedShippingInCents={storedShippingInCents}
          appliedCouponCode={cart.appliedCouponCode ?? null}
          discountInCents={cart.discountInCents ?? 0}
          address={cart.shippingAddress}
          products={cart.items.map((item) => ({
            id: item.productVariant.id,
            productId: item.productVariant.product.id,
            name: item.productVariant.product.name,
            variantName: item.productVariant.name,
            quantity: item.quantity,
            priceInCents: item.productVariant.priceInCents,
            imageUrl: item.productVariant.imageUrl,
            customizationExtraInCents: item.customizationExtraInCents ?? 0,
            customizationName: item.customizationName ?? null,
            customizationNumber: item.customizationNumber ?? null,
            customizationPatchText: item.customizationPatchId ?? null,
          }))}
        />
      </div>
    </div>
  );
};

export default ConfirmationPage;
