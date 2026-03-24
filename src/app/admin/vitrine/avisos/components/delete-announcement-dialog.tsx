"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { deleteAnnouncementBar } from "@/actions/delete-announcement-bar";
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
import type { AnnouncementBar } from "@/lib/queries/announcement-bars";

type DeleteAnnouncementDialogProps = {
  bar: AnnouncementBar | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function DeleteAnnouncementDialog({
  bar,
  open,
  onOpenChange,
  onSuccess,
}: DeleteAnnouncementDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!bar) return;

    startTransition(async () => {
      const result = await deleteAnnouncementBar({ id: bar.id });

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
          <AlertDialogTitle>Excluir aviso</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o aviso{" "}
            <strong>&ldquo;{bar?.text}&rdquo;</strong>? Esta ação não pode ser
            desfeita.
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
