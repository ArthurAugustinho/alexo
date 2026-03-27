"use client";

import { useState } from "react";

import CartSummary from "@/app/cart/components/cart-summary";
import { formatAddress } from "@/app/cart/helpers/address";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ShippingOption } from "@/lib/shipping-schema";

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
  products: Product[];
  address: Address;
  appliedCouponCode: string | null;
  discountInCents: number;
};

export function ConfirmationClient({
  subtotalInCents,
  products,
  address,
  appliedCouponCode,
  discountInCents,
}: Props) {
  const [selectedShipping, setSelectedShipping] =
    useState<ShippingOption | null>(null);

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
          <FinishOrderButton
            shippingCostInCents={selectedShipping?.priceInCents ?? 0}
            shippingNotSelected={selectedShipping === null}
          />
        </CardContent>
      </Card>

      <CartSummary
        subtotalInCents={subtotalInCents}
        appliedCouponCode={appliedCouponCode}
        discountInCents={discountInCents}
        products={products}
        onShippingChange={setSelectedShipping}
      />
    </div>
  );
}
