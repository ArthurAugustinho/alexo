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
  type ProductSizeModel,
  type ProductSizeType,
  type ProductVariantModel,
} from "@/lib/product-variant-schema";

type VariantFormProps = {
  mode: "create" | "edit";
  productId: string;
  sizeType: ProductSizeType;
  productSizes: ProductSizeModel[];
  trigger?: React.ReactNode;
  variant?: ProductVariantModel;
};

function getDefaultSize(params: {
  sizeType: ProductSizeType;
  productSizes: ProductSizeModel[];
  variant?: ProductVariantModel;
}) {
  if (params.variant?.size) {
    return params.variant.size;
  }

  if (params.sizeType === "numeric") {
    return params.productSizes[0]?.sizeValue ?? "33";
  }

  return "M";
}

export function VariantForm({
  mode,
  productId,
  sizeType,
  productSizes,
  trigger,
  variant,
}: VariantFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const sizeOptions = useMemo(() => {
    const baseOptions =
      sizeType === "numeric"
        ? productSizes.map((size) => size.sizeValue)
        : [...PRODUCT_VARIANT_SIZE_VALUES];

    if (variant?.size && !baseOptions.includes(variant.size)) {
      return [variant.size, ...baseOptions];
    }

    return baseOptions;
  }, [productSizes, sizeType, variant?.size]);

  const defaultValues = useMemo<AdminVariantFormValues>(
    () => ({
      productId,
      color: variant?.color ?? "",
      size: getDefaultSize({
        sizeType,
        productSizes,
        variant,
      }),
      imageUrl: variant?.imageUrl ?? "",
      stock: variant?.stock ?? 0,
    }),
    [productId, productSizes, sizeType, variant],
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
            Defina cor, tamanho, imagem e estoque. A disponibilidade e
            sincronizada automaticamente a partir do estoque salvo.
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
                    <FormLabel>
                      Tamanho {sizeType === "numeric" ? "numerico" : ""}
                    </FormLabel>
                    <FormControl>
                      <select
                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-xl border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]"
                        {...field}
                      >
                        {sizeOptions.map((sizeOption) => (
                          <option key={sizeOption} value={sizeOption}>
                            {sizeOption}
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
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        className="rounded-xl"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        disabled={field.disabled}
                        value={typeof field.value === "number" ? field.value : ""}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === ""
                              ? 0
                              : Number(event.target.value),
                          )
                        }
                      />
                    </FormControl>
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
                {mode === "create" ? "Salvar variante" : "Salvar alteracoes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
