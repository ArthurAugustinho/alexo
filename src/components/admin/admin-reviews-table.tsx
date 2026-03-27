"use client";

import { CheckIcon, TrashIcon } from "lucide-react";
import Image from "next/image";
import { useTransition } from "react";
import { toast } from "sonner";

import { approveReview } from "@/actions/approve-review";
import { deleteReview } from "@/actions/delete-review";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import type { ReviewWithUser } from "@/lib/queries/reviews";

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

type ReviewRowProps = {
  review: ReviewWithUser;
};

function ReviewRow({ review }: ReviewRowProps) {
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      const result = await approveReview({ reviewId: review.id });
      if (!result.success) {
        toast.error(result.message);
      } else {
        toast.success(result.message);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteReview({ reviewId: review.id });
      if (!result.success) {
        toast.error(result.message);
      } else {
        toast.success(result.message);
      }
    });
  }

  return (
    <div className="border-border/60 flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage src={review.user.image ?? undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(review.user.name)}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm font-medium">{review.user.name}</p>
          <StarRating value={review.rating} size="sm" />
          <Badge variant={review.isApproved ? "default" : "secondary"}>
            {review.isApproved ? "Publicada" : "Pendente"}
          </Badge>
          <span className="text-muted-foreground text-xs">
            {new Date(review.createdAt).toLocaleDateString("pt-BR")}
          </span>
        </div>

        {review.title && (
          <p className="text-sm font-medium">{review.title}</p>
        )}
        {review.body && (
          <p className="text-muted-foreground text-sm">{review.body}</p>
        )}

        {review.photoUrls.length > 0 && (
          <div className="flex gap-2">
            {review.photoUrls.map((url, i) => (
              <div key={i} className="relative size-14 overflow-hidden rounded-lg">
                <Image
                  src={url}
                  alt={`Foto ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 gap-2">
        {!review.isApproved && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={isPending}
            onClick={handleApprove}
          >
            <CheckIcon className="size-4" />
            Aprovar
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-destructive hover:text-destructive"
          disabled={isPending}
          onClick={handleDelete}
        >
          <TrashIcon className="size-4" />
          Excluir
        </Button>
      </div>
    </div>
  );
}

type AdminReviewsTableProps = {
  reviews: ReviewWithUser[];
};

export function AdminReviewsTable({ reviews }: AdminReviewsTableProps) {
  if (reviews.length === 0) {
    return (
      <div className="border-border/70 rounded-3xl border p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Nenhuma avaliação encontrada.
        </p>
      </div>
    );
  }

  const pending = reviews.filter((r) => !r.isApproved);
  const approved = reviews.filter((r) => r.isApproved);

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <section className="border-border/70 rounded-3xl border p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            Pendentes ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((review) => (
              <ReviewRow key={review.id} review={review} />
            ))}
          </div>
        </section>
      )}

      {approved.length > 0 && (
        <section className="border-border/70 rounded-3xl border p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            Publicadas ({approved.length})
          </h2>
          <div className="space-y-3">
            {approved.map((review) => (
              <ReviewRow key={review.id} review={review} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
