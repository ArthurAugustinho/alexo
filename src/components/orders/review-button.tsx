"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CheckIcon, StarIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { ReviewDialog } from "./review-dialog";

type ReviewButtonProps = {
  productId: string;
  productName: string;
  hasReviewed: boolean;
};

export function ReviewButton({
  productId,
  productName,
  hasReviewed: initialHasReviewed,
}: ReviewButtonProps) {
  const [open, setOpen] = useState(false);
  const [reviewed, setReviewed] = useState(initialHasReviewed);
  const queryClient = useQueryClient();

  if (reviewed) {
    return (
      <span className="text-muted-foreground flex items-center gap-1 text-xs">
        <CheckIcon className="size-3" />
        Avaliado
      </span>
    );
  }

  function handleSuccess() {
    setReviewed(true);
    void queryClient.invalidateQueries({ queryKey: ["orders"] });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto px-2 py-1 text-xs"
        onClick={() => setOpen(true)}
      >
        <StarIcon className="size-3" />
        Avaliar
      </Button>
      <ReviewDialog
        productId={productId}
        productName={productName}
        open={open}
        onOpenChange={setOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
}
