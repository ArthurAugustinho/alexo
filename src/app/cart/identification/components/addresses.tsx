"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AddressForm } from "@/components/addresses/address-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useUpdateCartShippingAddress } from "@/hooks/mutations/use-update-cart-shipping-address";
import { getAddressesQueryKey, useAddresses } from "@/hooks/queries/use-addresses";
import type { ShippingAddress } from "@/lib/queries/addresses";

interface AddressesProps {
  userId: string;
  shippingAddresses: ShippingAddress[];
  defaultAddressId: string | null;
}

const Addresses = ({
  userId,
  shippingAddresses,
  defaultAddressId,
}: AddressesProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedAddress, setSelectedAddress] = useState<string | null>(
    defaultAddressId,
  );
  const [showNewForm, setShowNewForm] = useState(false);

  const { data: addresses = shippingAddresses } = useAddresses(userId);
  const updateCartShippingAddressMutation = useUpdateCartShippingAddress();

  async function handleGoToPayment() {
    if (!selectedAddress || selectedAddress === "add_new") return;

    try {
      await updateCartShippingAddressMutation.mutateAsync({
        shippingAddressId: selectedAddress,
      });
      router.push("/cart/confirmation");
    } catch {
      toast.error("Erro ao selecionar endereço. Tente novamente.");
    }
  }

  function handleNewAddressSuccess(id: string) {
    void queryClient.invalidateQueries({
      queryKey: getAddressesQueryKey(userId),
    });
    setSelectedAddress(id);
    setShowNewForm(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Endereço de entrega</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={selectedAddress ?? undefined}
          onValueChange={(v) => {
            if (v === "add_new") {
              setShowNewForm(true);
              setSelectedAddress("add_new");
            } else {
              setShowNewForm(false);
              setSelectedAddress(v);
            }
          }}
        >
          {addresses.map((address) => (
            <Card key={address.id} className="cursor-pointer">
              <CardContent className="py-3">
                <div className="flex items-start gap-3">
                  <RadioGroupItem
                    value={address.id}
                    id={address.id}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor={address.id}
                    className="flex-1 cursor-pointer space-y-0.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{address.label}</span>
                      {address.isDefault && (
                        <Badge
                          variant="secondary"
                          className="rounded-full px-2 py-0 text-[10px]"
                        >
                          PADRÃO
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {address.street}, {address.number}
                      {address.complement ? ` - ${address.complement}` : ""},{" "}
                      {address.city}/{address.state}
                    </p>
                  </Label>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="cursor-pointer">
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                <RadioGroupItem value="add_new" id="add_new" />
                <Label htmlFor="add_new" className="cursor-pointer text-sm">
                  + Usar novo endereço
                </Label>
              </div>
            </CardContent>
          </Card>
        </RadioGroup>

        {showNewForm && (
          <div className="rounded-2xl border p-4">
            <AddressForm
              userId={userId}
              onSuccess={handleNewAddressSuccess}
              onCancel={() => {
                setShowNewForm(false);
                setSelectedAddress(defaultAddressId);
              }}
            />
          </div>
        )}

        {selectedAddress && selectedAddress !== "add_new" && !showNewForm && (
          <Button
            onClick={handleGoToPayment}
            className="w-full"
            disabled={updateCartShippingAddressMutation.isPending}
          >
            {updateCartShippingAddressMutation.isPending
              ? "Processando..."
              : "Continuar →"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default Addresses;
