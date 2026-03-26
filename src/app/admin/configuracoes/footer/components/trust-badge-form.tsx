"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Loader2Icon } from "lucide-react";
import { useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createTrustBadge } from "@/actions/create-trust-badge";
import { updateTrustBadge } from "@/actions/update-trust-badge";
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
import type { TrustBadge } from "@/lib/queries/trust-badges";

const ACCEPTED_MIME_TYPES = ["image/svg+xml", "image/png", "image/jpeg"];
const MAX_SIZE = 2 * 1024 * 1024;

const trustBadgeFormSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Informe o nome do selo.")
    .max(100, "Máximo 100 caracteres."),
  imageUrl: z
    .string()
    .trim()
    .min(1, "Informe a URL da imagem.")
    .refine(
      (val) =>
        val.startsWith("/uploads/") ||
        val.startsWith("http://") ||
        val.startsWith("https://"),
      { message: "URL da imagem inválida." },
    ),
  linkUrl: z.string().url("URL inválida.").or(z.literal("")).optional(),
  isActive: z.boolean(),
});

type TrustBadgeFormValues = z.infer<typeof trustBadgeFormSchema>;

type TrustBadgeFormProps = {
  badge?: TrustBadge | null;
  onSuccess: () => void;
};

export function TrustBadgeForm({ badge, onSuccess }: TrustBadgeFormProps) {
  const [isPending, startTransition] = useTransition();
  const { upload, isUploading, error: uploadError } = useUploadBrandLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(badge);

  const form = useForm<TrustBadgeFormValues>({
    resolver: zodResolver(trustBadgeFormSchema),
    defaultValues: {
      label: badge?.label ?? "",
      imageUrl: badge?.imageUrl ?? "",
      linkUrl: badge?.linkUrl ?? "",
      isActive: badge?.isActive ?? true,
    },
  });

  const watchedImageUrl = form.watch("imageUrl");
  const labelLength = form.watch("label")?.length ?? 0;

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

  function onSubmit(values: TrustBadgeFormValues) {
    startTransition(async () => {
      const result =
        isEditing && badge
          ? await updateTrustBadge({ id: badge.id, ...values })
          : await createTrustBadge(values);

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
          {isEditing ? "Editar selo" : "Novo selo de segurança"}
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Edite as informações do selo."
            : "Adicione um novo selo de segurança ao footer."}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Nome do selo</FormLabel>
                  <span className="text-muted-foreground text-xs">
                    {labelLength}/100
                  </span>
                </div>
                <FormControl>
                  <Input
                    placeholder="SSL Seguro, Stripe Verified..."
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
                <FormLabel>Imagem / Logo</FormLabel>

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
                        "Selecionar arquivo (SVG, PNG, JPG — máx. 2MB)"
                      )}
                    </Button>
                    {uploadError && (
                      <p className="text-destructive text-sm">{uploadError}</p>
                    )}
                  </TabsContent>

                  <TabsContent value="url" className="mt-3">
                    <Input
                      placeholder="https://cdn.exemplo.com/logo.png"
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

          {/* Preview 32×32 */}
          <div className="flex size-10 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
            {watchedImageUrl ? (
              <div
                className="size-full"
                style={{
                  backgroundImage: `url(${watchedImageUrl})`,
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                }}
              />
            ) : (
              <ImageIcon className="text-muted-foreground size-5" />
            )}
          </div>

          <FormField
            control={form.control}
            name="linkUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link ao clicar (opcional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://reclameaqui.com.br/empresa/..."
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
                : "Adicionar selo"}
          </Button>
        </form>
      </Form>
    </>
  );
}
