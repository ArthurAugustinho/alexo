"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Loader2Icon } from "lucide-react";
import { useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createPartnerBrand } from "@/actions/create-partner-brand";
import { updatePartnerBrand } from "@/actions/update-partner-brand";
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
  partnerBrandFormSchema,
  type PartnerBrandFormValues,
} from "@/lib/partner-brand-schema";
import type { PartnerBrand } from "@/lib/queries/partner-brands";

const ACCEPTED_MIME_TYPES = ["image/svg+xml", "image/png", "image/jpeg"];
const MAX_SIZE = 2 * 1024 * 1024;

type BrandFormProps = {
  brand?: PartnerBrand | null;
  nextPosition: number;
  onSuccess: () => void;
};

export function BrandForm({ brand, nextPosition, onSuccess }: BrandFormProps) {
  const [isPending, startTransition] = useTransition();
  const { upload, isUploading, error: uploadError } = useUploadBrandLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(brand);

  const form = useForm<PartnerBrandFormValues>({
    resolver: zodResolver(partnerBrandFormSchema),
    defaultValues: {
      name: brand?.name ?? "",
      logoUrl: brand?.logoUrl ?? "",
      linkUrl: brand?.linkUrl ?? "",
      isActive: brand?.isActive ?? true,
      position: brand?.position ?? nextPosition,
    },
  });

  const watchedLogoUrl = form.watch("logoUrl");

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
      form.setValue("logoUrl", url, { shouldValidate: true });
    } else {
      toast.error(uploadError ?? "Falha no upload.");
    }
  }

  function onSubmit(values: PartnerBrandFormValues) {
    startTransition(async () => {
      const result =
        isEditing && brand
          ? await updatePartnerBrand({ id: brand.id, ...values })
          : await createPartnerBrand(values);

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
          {isEditing ? "Editar marca" : "Nova marca parceira"}
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Edite as informações da marca."
            : "Preencha as informações para adicionar uma nova marca."}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Nome da marca</FormLabel>
                  <span className="text-muted-foreground text-xs">
                    {field.value?.length ?? 0}/100
                  </span>
                </div>
                <FormControl>
                  <Input
                    placeholder="Nike, Adidas, Hering..."
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
            name="logoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Logo</FormLabel>

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

          <div className="flex h-[60px] w-[80px] items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
            {watchedLogoUrl ? (
              <div
                className="h-full w-full grayscale"
                style={{
                  backgroundImage: `url(${watchedLogoUrl})`,
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
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
                <FormLabel>Link (opcional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://marca.com.br"
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
                : "Adicionar marca"}
          </Button>
        </form>
      </Form>
    </>
  );
}
