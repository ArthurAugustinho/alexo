"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Loader2Icon } from "lucide-react";
import { useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createHighlightCard } from "@/actions/create-highlight-card";
import { updateHighlightCard } from "@/actions/update-highlight-card";
import { Button } from "@/components/ui/button";
import {
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUploadBrandLogo } from "@/hooks/mutations/use-upload-brand-logo";
import {
  highlightCardFormSchema,
  type HighlightCardFormValues,
} from "@/lib/highlight-card-schema";
import type { HighlightCard } from "@/lib/queries/highlight-cards";

const ACCEPTED_MIME_TYPES = ["image/svg+xml", "image/png", "image/jpeg"];
const MAX_SIZE = 2 * 1024 * 1024;

type HighlightFormProps = {
  card?: HighlightCard | null;
  position: 1 | 2 | 3;
  onSuccess: () => void;
};

export function HighlightForm({ card, position, onSuccess }: HighlightFormProps) {
  const [isPending, startTransition] = useTransition();
  const { upload, isUploading, error: uploadError } = useUploadBrandLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(card);

  const form = useForm<HighlightCardFormValues>({
    resolver: zodResolver(highlightCardFormSchema),
    defaultValues: {
      title: card?.title ?? "",
      imageUrl: card?.imageUrl ?? "",
      linkUrl: card?.linkUrl ?? "",
      position: card?.position ?? position,
      isActive: card?.isActive ?? true,
    },
  });

  const watchedImageUrl = form.watch("imageUrl");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      toast.error("Formato inválido. Use SVG, PNG ou JPG.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_SIZE) {
      toast.error("Arquivo muito grande. Máximo 2MB.");
      e.target.value = "";
      return;
    }

    const url = await upload(file);
    if (url) {
      form.setValue("imageUrl", url, { shouldValidate: true });
    } else {
      toast.error(uploadError ?? "Falha no upload.");
    }
  }

  function onSubmit(values: HighlightCardFormValues) {
    startTransition(async () => {
      const result =
        isEditing && card
          ? await updateHighlightCard({ id: card.id, ...values })
          : await createHighlightCard(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      onSuccess();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {isEditing ? "Editar destaque" : `Preencher posição ${position}`}
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Edite as informações do card de destaque."
            : "Preencha as informações para criar um card de destaque."}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Título</FormLabel>
                  <span className="text-muted-foreground text-xs">
                    {field.value?.length ?? 0}/100
                  </span>
                </div>
                <FormControl>
                  <Input
                    placeholder="Nova Coleção Verão"
                    maxLength={100}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Imagem</FormLabel>

                <Tabs defaultValue="upload">
                  <TabsList className="w-full">
                    <TabsTrigger value="upload" className="flex-1">
                      Upload de arquivo
                    </TabsTrigger>
                    <TabsTrigger value="url" className="flex-1">
                      URL externa
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="mt-3 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".svg,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isUploading ? (
                        <>
                          <Loader2Icon className="size-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Selecionar imagem (SVG, PNG, JPG — máx. 2MB)"
                      )}
                    </Button>
                    {uploadError && (
                      <p className="text-destructive text-sm">{uploadError}</p>
                    )}
                  </TabsContent>

                  <TabsContent value="url" className="mt-3">
                    <Input
                      placeholder="https://cdn.exemplo.com/imagem.jpg"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </TabsContent>
                </Tabs>

                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex h-[80px] w-[120px] items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
            {watchedImageUrl ? (
              <div
                className="h-full w-full"
                style={{
                  backgroundImage: `url(${watchedImageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            ) : (
              <ImageIcon className="text-muted-foreground size-6" />
            )}
          </div>

          <FormField
            control={form.control}
            name="linkUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link do card</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://loja.com/categoria/verao"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="!mt-0 cursor-pointer">
                  {field.value ? "Ativo" : "Inativo"}
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || isUploading}
          >
            {isPending
              ? "Salvando..."
              : isEditing
                ? "Salvar alterações"
                : "Criar destaque"}
          </Button>
        </form>
      </Form>
    </>
  );
}
