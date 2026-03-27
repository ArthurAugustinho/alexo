"use client";

import { useQueryClient } from "@tanstack/react-query";
import { BriefcaseIcon, HomeIcon, MapPinIcon, StarIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { setDefaultAddress } from "@/actions/set-default-address";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAddressesQueryKey } from "@/hooks/queries/use-addresses";
import type { ShippingAddress } from "@/lib/queries/addresses";

function LabelIcon({ label }: { label: string }) {
  if (label === "Casa") return <HomeIcon className="size-4" />;
  if (label === "Trabalho") return <BriefcaseIcon className="size-4" />;
  return <MapPinIcon className="size-4" />;
}

type Props = {
  address: ShippingAddress;
  userId: string;
  onEdit: () => void;
  onDelete: () => void;
};

export function AddressCard({ address, userId, onEdit, onDelete }: Props) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  function handleSetDefault() {
    startTransition(async () => {
      const result = await setDefaultAddress({ addressId: address.id });
      if (result.success) {
        toast.success(result.message);
        void queryClient.invalidateQueries({
          queryKey: getAddressesQueryKey(userId),
        });
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            <LabelIcon label={address.label} />
          </span>
          <span className="text-sm font-semibold">{address.label}</span>
          {address.isDefault && (
            <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px]">
              PADRÃO
            </Badge>
          )}
        </div>
      </div>

      <div className="text-sm space-y-0.5">
        <p className="font-medium">{address.recipientName}</p>
        <p className="text-muted-foreground">
          {address.street}, {address.number}
          {address.complement ? ` - ${address.complement}` : ""}
        </p>
        <p className="text-muted-foreground">
          {address.neighborhood}, {address.city} - {address.state},{" "}
          {address.zipCode.replace(/(\d{5})(\d{3})/, "$1-$2")}
        </p>
        {address.phone && (
          <p className="text-muted-foreground">
            {address.phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={onEdit}>
          Editar
        </Button>
        <Button size="sm" variant="outline" onClick={onDelete}>
          Excluir
        </Button>
        {!address.isDefault && (
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={handleSetDefault}
            className="text-muted-foreground gap-1"
          >
            <StarIcon className="size-3.5" />
            {isPending ? "Definindo..." : "Definir padrão"}
          </Button>
        )}
      </div>
    </div>
  );
}
