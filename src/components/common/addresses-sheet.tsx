"use client";

import { useQueryClient } from "@tanstack/react-query";
import { MapPinIcon, PlusIcon } from "lucide-react";
import { useTransition } from "react";
import { useState } from "react";
import { toast } from "sonner";

import { deleteAddress } from "@/actions/delete-address";
import { AddressCard } from "@/components/addresses/address-card";
import { AddressForm } from "@/components/addresses/address-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { getAddressesQueryKey, useAddresses } from "@/hooks/queries/use-addresses";
import type { ShippingAddress } from "@/lib/queries/addresses";

type View = "list" | "create" | "edit";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
};

export function AddressesSheet({ open, onOpenChange, userId }: Props) {
  const { data: addresses = [], isLoading } = useAddresses(userId);
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("list");
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ShippingAddress | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleEdit(address: ShippingAddress) {
    setEditingAddress(address);
    setView("edit");
  }

  function handleFormSuccess() {
    setView("list");
    setEditingAddress(null);
  }

  function handleFormCancel() {
    setView("list");
    setEditingAddress(null);
  }

  function handleDelete(address: ShippingAddress) {
    setDeleteTarget(address);
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteAddress({ addressId: deleteTarget.id });
      if (result.success) {
        toast.success(result.message);
        void queryClient.invalidateQueries({
          queryKey: getAddressesQueryKey(userId),
        });
      } else {
        toast.error(result.message);
      }
      setDeleteTarget(null);
    });
  }

  const title =
    view === "create"
      ? "Novo endereço"
      : view === "edit"
        ? "Editar endereço"
        : "Meus endereços";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              {view !== "list" ? (
                <button
                  type="button"
                  onClick={handleFormCancel}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
                >
                  ← Voltar
                </button>
              ) : (
                <div />
              )}
              <SheetTitle className="absolute left-1/2 -translate-x-1/2">{title}</SheetTitle>
              {view === "list" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setView("create")}
                  className="gap-1"
                >
                  <PlusIcon className="size-3.5" />
                  Adicionar
                </Button>
              )}
            </div>
          </SheetHeader>

          <div className="mt-6 px-1">
            {view === "list" ? (
              <>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-12 text-center">
                    <MapPinIcon className="text-muted-foreground size-10" />
                    <div>
                      <p className="font-medium">Nenhum endereço cadastrado</p>
                      <p className="text-muted-foreground text-sm">
                        Adicione um endereço para agilizar seus pedidos.
                      </p>
                    </div>
                    <Button onClick={() => setView("create")}>
                      Adicionar endereço
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <AddressCard
                        key={address.id}
                        address={address}
                        userId={userId}
                        onEdit={() => handleEdit(address)}
                        onDelete={() => handleDelete(address)}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => setView("create")}
                      className="border-dashed hover:bg-muted flex w-full items-center justify-center gap-2 rounded-2xl border py-4 text-sm transition-colors"
                    >
                      <PlusIcon className="size-4" />
                      Adicionar novo endereço
                    </button>
                  </div>
                )}
              </>
            ) : (
              <AddressForm
                address={view === "edit" ? (editingAddress ?? undefined) : undefined}
                userId={userId}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir endereço</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja excluir o endereço{" "}
              <span className="font-medium">{deleteTarget?.label}</span>? Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isPending}
            >
              {isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
