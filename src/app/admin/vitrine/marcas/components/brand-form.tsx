"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useTransition } from "react";
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
import {
  partnerBrandFormSchema,
  type PartnerBrandFormValues,
} from "@/lib/partner-brand-schema";
import type { PartnerBrand } from "@/lib/queries/partner-brands";

type BrandFormProps = {
  brand?: PartnerBrand | null;
  nextPosition: number;
  onSuccess: () => void;
};

export function BrandForm({ brand, nextPosition, onSuccess }: BrandFormProps) {
  const [isPending, startTransition] = useTransition();
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
                <FormLabel>URL da logo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://cdn.exemplo.com/logo.png"
                    {...field}
                  />
                </FormControl>
                <FormMessage />

                {watchedLogoUrl && (
                  <div className="flex h-[90px] w-[110px] items-center justify-center rounded-lg border p-3">
                    <div className="relative h-12 w-full">
                      <Image
                        src={watchedLogoUrl}
                        alt="Preview da logo"
                        fill
                        className="object-contain grayscale"
                        sizes="110px"
                        unoptimized
                      />
                    </div>
                  </div>
                )}
              </FormItem>
            )}
          />

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

          <Button type="submit" className="w-full" disabled={isPending}>
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
