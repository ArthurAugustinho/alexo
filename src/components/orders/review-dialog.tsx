"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Loader2Icon, XIcon } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createProductReview } from "@/actions/create-product-review";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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

const reviewFormSchema = z.object({
  rating: z.coerce.number().int().min(1, "Avalie com pelo menos 1 estrela.").max(5),
  title: z.string().trim().max(150).optional(),
  body: z.string().trim().max(2000).optional(),
  photoUrls: z.array(z.string().url()).max(3).default([]),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

type ReviewDialogProps = {
  productId: string;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function ReviewDialog({
  productId,
  productName,
  open,
  onOpenChange,
  onSuccess,
}: ReviewDialogProps) {
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
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar produto</DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
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
              <p className="text-sm font-medium">Fotos (opcional, máx. 3)</p>

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
