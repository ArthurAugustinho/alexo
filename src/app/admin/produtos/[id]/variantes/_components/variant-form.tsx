"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { createVariant, updateVariant } from "@/lib/actions/variants";
import {
  type AdminVariantFormValues,
  type AdminVariantInput,
  adminVariantSchema,
} from "@/lib/admin-variant-schema";
import {
  PRODUCT_VARIANT_SIZE_VALUES,
  type ProductVariantModel,
} from "@/lib/product-variant-schema";

type VariantFormProps = {
  mode: "create" | "edit";
  productId: string;
  trigger?: React.ReactNode;
  variant?: ProductVariantModel;
};

export function VariantForm({
  mode,
  productId,
  trigger,
  variant,
}: VariantFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const defaultValues = useMemo<AdminVariantFormValues>(
    () => ({
      productId,
      color: variant?.color ?? "",
      size: variant?.size ?? "M",
      imageUrl: variant?.imageUrl ?? "",
      isAvailable: variant?.isAvailable ?? true,
    }),
    [productId, variant],
  );

  const form = useForm<AdminVariantFormValues, unknown, AdminVariantInput>({
    resolver: zodResolver(adminVariantSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  function onSubmit(values: AdminVariantInput) {
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createVariant(values)
          : await updateVariant({
              ...values,
              variantId: variant!.id,
            });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setIsOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="rounded-xl">
            <PlusIcon />
            Nova variante
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Criar variante" : "Editar variante"}
          </DialogTitle>
          <DialogDescription>
            Defina cor, tamanho, imagem e disponibilidade. O preço da nova
            variante herda o valor da variante base do produto para preservar a
            compatibilidade com o catálogo atual.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor</FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-xl"
                      placeholder="Ex: Preto"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamanho</FormLabel>
                    <FormControl>
                      <select
                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-xl border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]"
                        {...field}
                      >
                        {PRODUCT_VARIANT_SIZE_VALUES.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isAvailable"
                render={({ field }) => (
                  <FormItem className="rounded-2xl border px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <FormLabel className="text-sm font-medium">
                          Disponível
                        </FormLabel>
                        <p className="text-muted-foreground text-xs">
                          Controla se a variante pode ser comprada na loja.
                        </p>
                      </div>

                      <FormControl>
                        <input
                          type="checkbox"
                          className="size-4 rounded border"
                          checked={Boolean(field.value)}
                          onChange={(event) =>
                            field.onChange(event.target.checked)
                          }
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imagem</FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-xl"
                      placeholder="https://..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="rounded-xl" disabled={isPending}>
                {mode === "create" ? "Salvar variante" : "Salvar alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
