"use client";

import Image from "next/image";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StarRating } from "@/components/ui/star-rating";
import type { ReviewStats, ReviewWithUser } from "@/lib/queries/reviews";

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

type ReviewCardProps = {
  review: ReviewWithUser;
};

function ReviewCard({ review }: ReviewCardProps) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <div className="border-border/60 space-y-2 border-b pb-5 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Avatar className="size-8">
            <AvatarImage src={review.user.image ?? undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(review.user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{review.user.name}</p>
            <p className="text-muted-foreground text-xs">
              {new Date(review.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <StarRating value={review.rating} size="sm" />
      </div>

      {review.title && (
        <p className="text-sm font-medium">{review.title}</p>
      )}
      {review.body && (
        <p className="text-muted-foreground text-sm leading-relaxed">
          {review.body}
        </p>
      )}

      {review.photoUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {review.photoUrls.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setLightbox(url)}
              className="relative size-16 overflow-hidden rounded-lg"
            >
              <Image
                src={url}
                alt={`Foto ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!lightbox} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent className="max-w-2xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Foto da avaliação</DialogTitle>
          </DialogHeader>
          {lightbox && (
            <div className="relative aspect-square w-full">
              <Image
                src={lightbox}
                alt="Foto da avaliação"
                fill
                className="rounded-lg object-contain"
                sizes="(max-width: 768px) 100vw, 672px"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

type RatingBarsProps = {
  stats: ReviewStats;
};

function RatingBars({ stats }: RatingBarsProps) {
  const ratings = [5, 4, 3, 2, 1] as const;

  return (
    <div className="space-y-1.5">
      {ratings.map((r) => {
        const count = stats.distribution[r];
        const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
        return (
          <div key={r} className="flex items-center gap-2 text-sm">
            <span className="w-3 text-right text-xs font-medium">{r}</span>
            <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-muted-foreground w-6 text-right text-xs">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

type ReviewSectionProps = {
  reviews: ReviewWithUser[];
  stats: ReviewStats;
};

export function ReviewSection({ reviews, stats }: ReviewSectionProps) {
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold">Avaliações</h2>

      {stats.total > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
          <div className="flex flex-col items-center gap-1">
            <span className="text-4xl font-bold">{stats.average.toFixed(1)}</span>
            <StarRating value={Math.round(stats.average)} size="md" />
            <span className="text-muted-foreground text-xs">
              {stats.total} {stats.total === 1 ? "avaliação" : "avaliações"}
            </span>
          </div>
          <div className="flex-1">
            <RatingBars stats={stats} />
          </div>
        </div>
      )}

      {reviews.length > 0 ? (
        <div className="space-y-5">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">Nenhuma avaliação ainda.</p>
      )}
    </section>
  );
}
