"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Loader2Icon } from "lucide-react";
import { useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createSimpleBanner } from "@/actions/create-simple-banner";
import { updateSimpleBanner } from "@/actions/update-simple-banner";
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
import type { SimpleBanner } from "@/lib/queries/simple-banner";

const formSchema = z.object({
  imageUrl: z.string().min(1, "Informe a URL da imagem."),
  linkUrl: z.string().url("URL inválida.").or(z.literal("")).optional(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

type SimpleBannerFormProps = {
  banner?: SimpleBanner | null;
  onSuccess: () => void;
};

const ACCEPTED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024;

export function SimpleBannerForm({ banner, onSuccess }: SimpleBannerFormProps) {
  const [isPending, startTransition] = useTransition();
  const { upload, isUploading, error: uploadError } = useUploadBrandLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(banner);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      imageUrl: banner?.imageUrl ?? "",
      linkUrl: banner?.linkUrl ?? "",
      isActive: banner?.isActive ?? true,
    },
  });

  const watchedImageUrl = form.watch("imageUrl");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      toast.error("Formato inválido. Use PNG, JPG ou WebP.");
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

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result =
        isEditing && banner
          ? await updateSimpleBanner({ id: banner.id, ...values })
          : await createSimpleBanner(values);

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
          {isEditing ? "Editar banner" : "Adicionar banner"}
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Edite as informações do banner simples."
            : "Configure um novo banner simples para a home."}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Imagem</FormLabel>
                <Tabs defaultValue="upload">
                  <TabsList className="w-full">
                    <TabsTrigger value="upload" className="flex-1">
                      Upload
                    </TabsTrigger>
                    <TabsTrigger value="url" className="flex-1">
                      URL externa
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="mt-3 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
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
                        "Selecionar imagem"
                      )}
                    </Button>
                    <div className="space-y-0.5">
                      <p className="text-muted-foreground text-sm">
                        Tamanho recomendado: 1440 × 200px
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Tamanho máximo do arquivo: 2MB
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Formatos aceitos: JPG, PNG ou WebP
                      </p>
                    </div>
                    {uploadError && (
                      <p className="text-destructive text-sm">{uploadError}</p>
                    )}
                  </TabsContent>
                  <TabsContent value="url" className="mt-3">
                    <Input
                      placeholder="https://cdn.exemplo.com/banner.jpg"
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

          {watchedImageUrl && (
            <div className="h-[200px] w-full overflow-hidden rounded-lg border">
              <div
                className="h-full w-full"
                style={{
                  backgroundImage: `url(${watchedImageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            </div>
          )}

          {!watchedImageUrl && (
            <div className="flex h-[200px] w-full items-center justify-center rounded-lg border bg-muted/20">
              <ImageIcon className="text-muted-foreground size-5" />
            </div>
          )}

          <FormField
            control={form.control}
            name="linkUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link ao clicar (opcional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://loja.com/promocao"
                    {...field}
                    value={field.value ?? ""}
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
                : "Criar banner"}
          </Button>
        </form>
      </Form>
    </>
  );
}
