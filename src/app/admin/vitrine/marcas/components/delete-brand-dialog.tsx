"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { deletePartnerBrand } from "@/actions/delete-partner-brand";
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
import type { PartnerBrand } from "@/lib/queries/partner-brands";

type DeleteBrandDialogProps = {
  brand: PartnerBrand | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function DeleteBrandDialog({
  brand,
  open,
  onOpenChange,
  onSuccess,
}: DeleteBrandDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!brand) return;

    startTransition(async () => {
      const result = await deletePartnerBrand({ id: brand.id });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      onSuccess();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir marca</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a marca{" "}
            <strong>&ldquo;{brand?.name}&rdquo;</strong>? Esta ação não pode
            ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            {isPending ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
