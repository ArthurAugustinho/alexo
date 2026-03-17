"use client";

import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type CartSummaryProduct = {
  id: string;
  name: string;
  variantName: string;
  quantity: number;
  priceInCents: number;
  imageUrl: string;
};

interface CartSummaryProps {
  subtotalInCents: number;
  totalInCents: number;
  products: CartSummaryProduct[];
}

const formatCurrency = (valueInCents: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(valueInCents / 100);

const CartSummary = ({
  subtotalInCents,
  totalInCents,
  products,
}: CartSummaryProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Seu pedido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span className="font-medium">
              {formatCurrency(subtotalInCents)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Transporte e Manuseio</span>
            <span className="text-muted-foreground">Grátis</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Taxa Estimada</span>
            <span className="text-muted-foreground">—</span>
          </div>
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(totalInCents)}</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id}>
              <div className="flex items-start gap-3">
                <div className="relative h-16 w-16 overflow-hidden rounded-md bg-muted">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-semibold leading-snug">{product.name}</p>
                  <p className="text-muted-foreground leading-snug">
                    {product.variantName}
                  </p>
                  <p className="text-muted-foreground leading-snug">
                    {product.quantity} {product.quantity > 1 ? "unidades" : "unidade"}
                  </p>
                  <p className="font-semibold">
                    {formatCurrency(
                      product.priceInCents * product.quantity,
                    )}
                  </p>
                </div>
              </div>
              <Separator className="mt-4" />
            </div>
          ))}
          {products.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              Seu carrinho está vazio.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CartSummary;
