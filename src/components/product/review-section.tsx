"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Loader2Icon, PlusIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createProductReview } from "@/actions/create-product-review";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { StarRating } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/textarea";
import type { ReviewStats, ReviewWithUser } from "@/lib/queries/reviews";

const reviewFormSchema = z.object({
  rating: z.coerce.number().int().min(1, "Avalie com pelo menos 1 estrela.").max(5),
  title: z.string().trim().max(150).optional(),
  body: z.string().trim().max(2000).optional(),
  photoUrls: z.array(z.string().url()).max(3).default([]),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

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

type ReviewFormDialogProps = {
  productId: string;
  isLoggedIn: boolean;
  hasAlreadyReviewed: boolean;
};

function ReviewFormDialog({
  productId,
  isLoggedIn,
  hasAlreadyReviewed,
}: ReviewFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formResolver = zodResolver(reviewFormSchema) as Resolver<ReviewFormValues, unknown, ReviewFormValues>;

  const form = useForm<ReviewFormValues, unknown, ReviewFormValues>({
    resolver: formResolver,
    defaultValues: { rating: 0, title: "", body: "", photoUrls: [] },
  });

  const watchedRating = form.watch("rating");
  const watchedPhotoUrls = form.watch("photoUrls");

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (watchedPhotoUrls.length >= 3) {
      toast.error("Máximo 3 fotos por avaliação.");
      return;
    }

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/review-photo", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Erro ao enviar foto.");
        return;
      }

      form.setValue("photoUrls", [...watchedPhotoUrls, data.url]);
    } catch {
      toast.error("Erro ao enviar foto.");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removePhoto(index: number) {
    form.setValue(
      "photoUrls",
      watchedPhotoUrls.filter((_, i) => i !== index),
    );
  }

  function onSubmit(values: ReviewFormValues) {
    startTransition(async () => {
      const result = await createProductReview({ ...values, productId });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setOpen(false);
      form.reset();
    });
  }

  if (hasAlreadyReviewed) {
    return (
      <p className="text-muted-foreground text-sm">
        Você já avaliou este produto.
      </p>
    );
  }

  if (!isLoggedIn) {
    return (
      <p className="text-muted-foreground text-sm">
        <a href="/login" className="text-primary underline-offset-4 hover:underline">
          Faça login
        </a>{" "}
        para deixar uma avaliação.
      </p>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <PlusIcon className="size-4" />
          Avaliar produto
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar produto</DialogTitle>
          <DialogDescription>
            Sua avaliação será publicada após revisão.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota</FormLabel>
                  <FormControl>
                    <StarRating
                      value={field.value}
                      interactive
                      onChange={field.onChange}
                      size="lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Ótima qualidade!" maxLength={150} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentário (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Conte mais sobre o produto..."
                      rows={3}
                      maxLength={2000}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <p className="text-sm font-medium">
                Fotos (opcional, máx. 3)
              </p>

              {watchedPhotoUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {watchedPhotoUrls.map((url, i) => (
                    <div key={i} className="relative size-16">
                      <Image
                        src={url}
                        alt={`Foto ${i + 1}`}
                        fill
                        className="rounded-lg object-cover"
                        sizes="64px"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-white"
                      >
                        <XIcon className="size-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {watchedPhotoUrls.length < 3 && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={uploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingPhoto ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <ImageIcon className="size-4" />
                    )}
                    Adicionar foto
                  </Button>
                </>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isPending || watchedRating === 0}
            >
              {isPending ? "Enviando..." : "Enviar avaliação"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

type ReviewSectionProps = {
  productId: string;
  reviews: ReviewWithUser[];
  stats: ReviewStats;
  isLoggedIn: boolean;
  hasAlreadyReviewed: boolean;
};

export function ReviewSection({
  productId,
  reviews,
  stats,
  isLoggedIn,
  hasAlreadyReviewed,
}: ReviewSectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Avaliações</h2>
        <ReviewFormDialog
          productId={productId}
          isLoggedIn={isLoggedIn}
          hasAlreadyReviewed={hasAlreadyReviewed}
        />
      </div>

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
        <p className="text-muted-foreground text-sm">
          Ainda sem avaliações. Seja o primeiro a avaliar!
        </p>
      )}
    </section>
  );
}
