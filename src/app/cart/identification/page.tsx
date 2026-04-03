import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Header } from "@/components/common/header";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { getAddressesByUser } from "@/lib/queries/addresses";

import CartSummary from "../components/cart-summary";
import Addresses from "./components/addresses";

const IdentificationPage = async () => {
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

  const addresses = await getAddressesByUser(session.user.id);
  const defaultAddress = addresses.find((a) => a.isDefault);
  const defaultAddressId =
    defaultAddress?.id ?? cart.shippingAddress?.id ?? null;

  const cartTotalInCents = cart.items.reduce(
    (acc, item) =>
      acc +
      item.productVariant.priceInCents * item.quantity +
      (item.customizationExtraInCents ?? 0),
    0,
  );

  return (
    <div>
      <Header />
      <div className="space-y-4 px-5">
        <Addresses
          userId={session.user.id}
          shippingAddresses={addresses}
          defaultAddressId={defaultAddressId}
        />
        <CartSummary
          subtotalInCents={cartTotalInCents}
          showShipping={false}
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

export default IdentificationPage;
