"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { deleteFaqItem } from "@/actions/delete-faq-item";
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
import type { FaqItem } from "@/lib/queries/faq";

type DeleteFaqDialogProps = {
  item: FaqItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function DeleteFaqDialog({
  item,
  open,
  onOpenChange,
  onSuccess,
}: DeleteFaqDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!item) return;

    startTransition(async () => {
      const result = await deleteFaqItem({ id: item.id });

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
          <AlertDialogTitle>Excluir pergunta</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a pergunta{" "}
            <strong>&ldquo;{item?.question}&rdquo;</strong>? Esta ação não pode
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
