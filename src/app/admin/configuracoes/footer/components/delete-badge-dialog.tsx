"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { deleteTrustBadge } from "@/actions/delete-trust-badge";
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
import type { TrustBadge } from "@/lib/queries/trust-badges";

type DeleteBadgeDialogProps = {
  badge: TrustBadge | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function DeleteBadgeDialog({
  badge,
  open,
  onOpenChange,
  onSuccess,
}: DeleteBadgeDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!badge) return;

    startTransition(async () => {
      const result = await deleteTrustBadge({ id: badge.id });

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
          <AlertDialogTitle>Excluir selo</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o selo{" "}
            <strong>&ldquo;{badge?.label}&rdquo;</strong>? Esta ação não pode
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
