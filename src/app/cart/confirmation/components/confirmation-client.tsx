"use client";

import CartSummary from "@/app/cart/components/cart-summary";
import { formatAddress } from "@/app/cart/helpers/address";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import FinishOrderButton from "./finish-order-button";

type Product = {
  id: string;
  productId: string;
  name: string;
  variantName: string;
  quantity: number;
  priceInCents: number;
  imageUrl: string;
};

type Address = {
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  recipientName: string;
  phone: string;
  email: string;
  cpfOrCnpj: string;
};

type Props = {
  subtotalInCents: number;
  storedShippingInCents: number;
  products: Product[];
  address: Address;
  appliedCouponCode: string | null;
  discountInCents: number;
};

export function ConfirmationClient({
  subtotalInCents,
  storedShippingInCents,
  products,
  address,
  appliedCouponCode,
  discountInCents,
}: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card>
            <CardContent>
              <p className="text-sm">{formatAddress(address)}</p>
            </CardContent>
          </Card>
          <FinishOrderButton />
        </CardContent>
      </Card>

      <CartSummary
        subtotalInCents={subtotalInCents}
        storedShippingInCents={storedShippingInCents}
        appliedCouponCode={appliedCouponCode}
        discountInCents={discountInCents}
        products={products}
        showShipping={false}
      />
    </div>
  );
}
