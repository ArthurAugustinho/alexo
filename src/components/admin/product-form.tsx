"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useTransition } from "react";
import { type Resolver, useFieldArray, useForm, useWatch } from "react-hook-form";
import { NumericFormat, PatternFormat } from "react-number-format";
import { toast } from "sonner";

import { createAdminProduct, updateAdminProduct } from "@/lib/actions/products";
import {
  type AdminProductInput,
  adminProductSchema,
} from "@/lib/admin-product-schema";
import { getColorHex } from "@/lib/color-map";
import {
  NUMERIC_PRODUCT_SIZE_VALUES,
  PRODUCT_VARIANT_SIZE_VALUES,
  type ProductSizeModel,
  type ProductSizeType,
} from "@/lib/product-variant-schema";
import { formatPostalCode } from "@/lib/shipping-schema";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";

type ProductFormCategory = {
  id: string;
  name: string;
};

type ProductFormVariant = {
  id: string;
  color: string;
  size: string;
  stock: number;
  imageUrl: string;
};

type ProductFormProduct = {
  id: string;
  name: string;
  brand: string | null;
  videoUrl: string | null;
  isVerified: boolean;
  originPostalCode: string | null;
  description: string;
  categoryId: string;
  shippingCostInCents: number;
  weightGrams: number | null;
  widthCm: number | null;
  heightCm: number | null;
  lengthCm: number | null;
  deliveryDaysMin: number | null;
  deliveryDaysMax: number | null;
  sizeType: ProductSizeType;
  productSizes: ProductSizeModel[];
  variants: ProductFormVariant[];
  primaryVariant: {
    id: string;
    name: string;
    color: string;
    priceInCents: number;
    imageUrl: string;
    size: string;
    stock: number;
  } | null;
  // Discount
  discountPercent: number | null;
  originalPriceInCents: number | null;
  badgeLabel: string | null;
  pixDiscountText: string | null;
  // Customization
  isCustomizable: boolean;
  customizationLeadDays: number;
  nameFieldEnabled: boolean;
  nameFieldPriceInCents: number;
  numberFieldEnabled: boolean;
  numberFieldPriceInCents: number;
  patchOptions: Array<{ id: string; label: string; imageUrl: string; priceInCents: number }> | null;
};

type ProductFormVariantStockRow = {
  variantId: string | null;
  color: string;
  size: string;
  stock: number;
  imageUrl: string;
};

type ProductFormProps = {
  categories: ProductFormCategory[];
  mode: "create" | "edit";
  product?: ProductFormProduct;
  onCancel: () => void;
  onSuccess: () => void;
};

function getEditableSizeValues(product?: ProductFormProduct) {
  if (!product) {
    return [];
  }

  if (product.sizeType === "numeric") {
    const configuredSizes = product.productSizes.map((size) => size.sizeValue);

    if (configuredSizes.length > 0) {
      return configuredSizes;
    }

    return Array.from(new Set(product.variants.map((variant) => variant.size)));
  }

  return [...PRODUCT_VARIANT_SIZE_VALUES];
}

function buildVariantStockGrid(
  product?: ProductFormProduct,
): ProductFormVariantStockRow[] {
  if (!product) {
    return [];
  }

  const sizeValues = getEditableSizeValues(product);

  if (sizeValues.length === 0) {
    return [];
  }

  const colorMap = new Map<string, { color: string; imageUrl: string }>();

  for (const variant of product.variants) {
    const colorKey = variant.color.trim().toLowerCase();

    if (!colorMap.has(colorKey)) {
      colorMap.set(colorKey, {
        color: variant.color,
        imageUrl: variant.imageUrl,
      });
    }
  }

  if (colorMap.size === 0 && product.primaryVariant) {
    colorMap.set(product.primaryVariant.color.trim().toLowerCase(), {
      color: product.primaryVariant.color,
      imageUrl: product.primaryVariant.imageUrl,
    });
  }

  const variantMap = new Map(
    product.variants.map((variant) => [
      `${variant.color.trim().toLowerCase()}::${variant.size}`,
      variant,
    ]),
  );
  const grid: ProductFormVariantStockRow[] = [];

  for (const { color, imageUrl } of colorMap.values()) {
    const colorKey = color.trim().toLowerCase();

    for (const size of sizeValues) {
      const existingVariant = variantMap.get(`${colorKey}::${size}`);

      grid.push({
        variantId: existingVariant?.id ?? null,
        color,
        size,
        stock: existingVariant?.stock ?? 0,
        imageUrl:
          existingVariant?.imageUrl ??
          imageUrl ??
          product.primaryVariant?.imageUrl ??
          "",
      });
    }
  }

  return grid;
}

export function ProductForm({
  categories,
  mode,
  product,
  onCancel,
  onSuccess,
}: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const variantStockGrid = useMemo(() => buildVariantStockGrid(product), [product]);

  const defaultValues = useMemo<AdminProductInput>(
    () => ({
      productId: product?.id,
      primaryVariantId: product?.primaryVariant?.id,
      name: product?.name ?? "",
      brand: product?.brand ?? "",
      discountPercent: product?.discountPercent ?? undefined,
      badgeLabel: product?.badgeLabel ?? "",
      pixDiscountText: product?.pixDiscountText ?? "",
      isCustomizable: product?.isCustomizable ?? false,
      customizationLeadDays: product?.customizationLeadDays ?? 2,
      nameFieldEnabled: product?.nameFieldEnabled ?? false,
      nameFieldPriceInReais: product ? product.nameFieldPriceInCents / 100 : 0,
      numberFieldEnabled: product?.numberFieldEnabled ?? false,
      numberFieldPriceInReais: product
        ? product.numberFieldPriceInCents / 100
        : 0,
      patches: product?.patchOptions ?? [],
      originPostalCode: formatPostalCode(product?.originPostalCode ?? ""),
      description: product?.description ?? "",
      categoryId: product?.categoryId ?? categories[0]?.id ?? "",
      variantName: product?.primaryVariant?.name ?? "",
      variantColor: product?.primaryVariant?.color ?? "",
      variantStock: product?.primaryVariant?.stock ?? 0,
      priceInReais: product?.primaryVariant
        ? (product.originalPriceInCents ?? product.primaryVariant.priceInCents) /
          100
        : 0,
      shippingCostInReais: product ? product.shippingCostInCents / 100 : 0,
      weightGrams: product?.weightGrams ?? null,
      widthCm: product?.widthCm ?? null,
      heightCm: product?.heightCm ?? null,
      lengthCm: product?.lengthCm ?? null,
      deliveryDaysMin: product?.deliveryDaysMin ?? null,
      deliveryDaysMax: product?.deliveryDaysMax ?? null,
      imageUrl: product?.primaryVariant?.imageUrl ?? "",
      videoUrl: product?.videoUrl ?? "",
      isVerified: product?.isVerified ?? false,
      sizeType: product?.sizeType ?? "alphabetic",
      productSizes: product?.productSizes.map((size) => size.sizeValue) ?? [],
      variantStocks: variantStockGrid,
    }),
    [categories, product, variantStockGrid],
  );

  const formResolver = zodResolver(
    adminProductSchema,
  ) as Resolver<AdminProductInput, unknown, AdminProductInput>;

  const form = useForm<AdminProductInput, unknown, AdminProductInput>({
    resolver: formResolver,
    defaultValues,
  });

  const { fields: variantStockFields } = useFieldArray({
    control: form.control,
    name: "variantStocks",
  });

  const {
    fields: patchFields,
    append: appendPatch,
    remove: removePatch,
  } = useFieldArray({
    control: form.control,
    name: "patches",
  });

  const selectedSizeType = useWatch({
    control: form.control,
    name: "sizeType",
  });

  const watchedPriceInReais = useWatch({
    control: form.control,
    name: "priceInReais",
  });

  const watchedDiscountPercent = useWatch({
    control: form.control,
    name: "discountPercent",
  });

  const watchedIsCustomizable = useWatch({
    control: form.control,
    name: "isCustomizable",
  });
  const selectedProductSizes = useWatch({
    control: form.control,
    name: "productSizes",
  });
  const watchedVariantStocks = useWatch({
    control: form.control,
    name: "variantStocks",
  });

  const groupedVariantStocks = useMemo(() => {
    const colorMap = new Map<
      string,
      {
        color: string;
        rows: Array<{
          fieldId: string;
          index: number;
          variantId: string | null;
          color: string;
          size: string;
          stock: number;
        }>;
      }
    >();

    for (const [index, field] of variantStockFields.entries()) {
      const currentVariantStock = watchedVariantStocks?.[index];
      const color = currentVariantStock?.color?.trim() || field.color;
      const size = currentVariantStock?.size?.trim() || field.size;
      const fallbackStock =
        typeof field.stock === "number" ? field.stock : Number(field.stock ?? 0);
      const stock =
        typeof currentVariantStock?.stock === "number"
          ? currentVariantStock.stock
          : fallbackStock;
      const variantId = currentVariantStock?.variantId ?? field.variantId ?? null;

      if (!color || !size) {
        continue;
      }

      const groupKey = color.toLowerCase();
      const currentGroup = colorMap.get(groupKey) ?? {
        color,
        rows: [],
      };

      currentGroup.rows.push({
        fieldId: field.id,
        index,
        variantId,
        color,
        size,
        stock,
      });

      colorMap.set(groupKey, currentGroup);
    }

    return Array.from(colorMap.values());
  }, [variantStockFields, watchedVariantStocks]);

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  function toggleNumericSize(sizeValue: string, checked: boolean) {
    const currentSizes = selectedProductSizes ?? [];
    const nextSizes = checked
      ? Array.from(new Set([...currentSizes, sizeValue]))
      : currentSizes.filter((currentSize) => currentSize !== sizeValue);

    form.setValue("productSizes", nextSizes, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function onSubmit(values: AdminProductInput) {
    startTransition(async () => {
      const action =
        mode === "create" ? createAdminProduct : updateAdminProduct;
      const currentVariantStocks = (form.getValues("variantStocks") ?? []).map(
        (variantStock) => ({
          variantId: variantStock.variantId ?? null,
          color: variantStock.color,
          size: variantStock.size,
          stock:
            typeof variantStock.stock === "number"
              ? variantStock.stock
              : Number(variantStock.stock ?? 0),
          imageUrl: variantStock.imageUrl,
        }),
      );
      const primaryVariantId = product?.primaryVariant?.id;
      const primaryVariantStock =
        mode === "edit" && primaryVariantId
          ? currentVariantStocks.find(
              (variantStock) => variantStock.variantId === primaryVariantId,
            )?.stock ?? values.variantStock
          : values.variantStock;
      const result = await action({
        ...values,
        variantStocks: currentVariantStocks,
        variantStock: primaryVariantStock,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      onSuccess();
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do produto</FormLabel>
                <FormControl>
                  <Input className="rounded-xl" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <FormControl>
                  <select
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-xl border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]"
                    {...field}
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca</FormLabel>
              <FormControl>
                <Input
                  className="rounded-xl"
                  placeholder="Ex: Nike"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descricao</FormLabel>
              <FormControl>
                <Textarea
                  className="rounded-2xl"
                  placeholder="Descreva os diferenciais do produto."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sizeType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Tipo de tamanho</FormLabel>
              <FormControl>
                <RadioGroup
                  className="grid gap-3 sm:grid-cols-2"
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <Label
                    htmlFor="size-type-alphabetic"
                    className="border-border/70 hover:border-primary/40 flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3"
                  >
                    <RadioGroupItem
                      id="size-type-alphabetic"
                      value="alphabetic"
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Alfabetico</p>
                      <p className="text-muted-foreground text-xs">
                        Usa a grade PP, P, M, G, GG e GGG nas variantes.
                      </p>
                    </div>
                  </Label>

                  <Label
                    htmlFor="size-type-numeric"
                    className="border-border/70 hover:border-primary/40 flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3"
                  >
                    <RadioGroupItem id="size-type-numeric" value="numeric" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Numerico</p>
                      <p className="text-muted-foreground text-xs">
                        Define uma grade propria de tamanhos de 33 a 48.
                      </p>
                    </div>
                  </Label>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedSizeType === "numeric" ? (
          <FormField
            control={form.control}
            name="productSizes"
            render={() => (
              <FormItem className="space-y-3">
                <FormLabel>Tamanhos numericos disponiveis</FormLabel>
                <div
                  role="group"
                  aria-label="Selecione os tamanhos numericos do produto"
                  className="grid grid-cols-4 gap-2 sm:grid-cols-8"
                >
                  {NUMERIC_PRODUCT_SIZE_VALUES.map((sizeValue) => {
                    const checked =
                      selectedProductSizes?.includes(sizeValue) ?? false;

                    return (
                      <label
                        key={sizeValue}
                        className="cursor-pointer"
                        htmlFor={`product-size-${sizeValue}`}
                      >
                        <input
                          id={`product-size-${sizeValue}`}
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={(event) =>
                            toggleNumericSize(sizeValue, event.target.checked)
                          }
                        />
                        <span
                          className={
                            checked
                              ? "border-primary bg-primary/8 flex h-11 items-center justify-center rounded-2xl border text-sm font-medium transition-colors"
                              : "border-border/70 flex h-11 items-center justify-center rounded-2xl border text-sm font-medium transition-colors"
                          }
                        >
                          {sizeValue}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-muted-foreground text-xs">
                  A ordem selecionada define a sequencia exibida na loja.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <div className="grid gap-5 md:grid-cols-3">
          <FormField
            control={form.control}
            name="variantName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da variante base</FormLabel>
                <FormControl>
                  <Input
                    className="rounded-xl"
                    placeholder="Ex: Preto classico"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="variantColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cor</FormLabel>
                <FormControl>
                  <Input className="rounded-xl" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {mode === "create" ? (
            <FormField
              control={form.control}
              name="variantStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estoque da variante base</FormLabel>
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
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 px-4 py-3">
              <p className="text-sm font-medium">Estoque da variante base</p>
              <p className="text-muted-foreground mt-1 text-xs">
                O estoque da variante base e ajustado na grade abaixo, junto com
                os demais tamanhos da mesma cor.
              </p>
            </div>
          )}
        </div>

        {mode === "edit" ? (
          <section className="space-y-4 rounded-3xl border border-border/70 bg-muted/10 p-5">
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Estoque por tamanho</h3>
              <p className="text-muted-foreground text-sm">
                Todos os tamanhos estao listados por cor. Tamanhos &quot;Novo&quot; serao
                criados ao salvar.
              </p>
            </div>

            {groupedVariantStocks.length === 0 ? (
              <div className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                Nenhuma variante cadastrada para este produto.
              </div>
            ) : (
              <div className="space-y-5">
                {groupedVariantStocks.map((group) => (
                  <div key={group.color} className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className="size-3 rounded-full border border-black/10"
                        style={{ backgroundColor: getColorHex(group.color) }}
                      />
                      <span>{group.color}</span>
                    </div>

                    <div className="space-y-0">
                      {group.rows.map((row) => {
                        const isNewVariant = row.variantId === null;
                        const isAvailable = row.stock > 0;

                        return (
                          <div
                            key={row.fieldId}
                            className="flex items-start justify-between gap-3 border-b border-border/50 py-2 last:border-b-0"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span
                                className="size-3 rounded-full border border-black/10"
                                style={{
                                  backgroundColor: getColorHex(row.color),
                                }}
                              />
                              <span className="text-sm font-medium">
                                {row.color} · {row.size}
                              </span>
                            </div>

                            <div className="flex items-start gap-3">
                              <div className="w-20">
                                <FormField
                                  control={form.control}
                                  name={`variantStocks.${row.index}.stock`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="0"
                                          step="1"
                                          className="h-10 rounded-xl text-right"
                                          name={field.name}
                                          ref={field.ref}
                                          onBlur={field.onBlur}
                                          disabled={field.disabled}
                                          value={
                                            typeof field.value === "number"
                                              ? field.value
                                              : ""
                                          }
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

                              <Badge
                                variant="outline"
                                className={
                                  isNewVariant
                                    ? "border-primary/30 bg-primary/5 text-primary"
                                    : isAvailable
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border-slate-200 bg-slate-100 text-slate-600"
                                }
                              >
                                {isNewVariant
                                  ? "Novo"
                                  : isAvailable
                                    ? "Disponivel"
                                    : "Indisponivel"}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="priceInReais"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preco (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
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

          <FormField
            control={form.control}
            name="shippingCostInReais"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frete (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
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

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <FormField
            control={form.control}
            name="originPostalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CEP do fornecedor</FormLabel>
                <FormControl>
                  <PatternFormat
                    format="#####-###"
                    mask="_"
                    customInput={Input}
                    className="rounded-xl"
                    placeholder="00000-000"
                    value={field.value ?? ""}
                    onValueChange={(values) =>
                      field.onChange(values.formattedValue)
                    }
                    onBlur={field.onBlur}
                    name={field.name}
                    getInputRef={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weightGrams"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peso (g)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
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
                          ? null
                          : Number(event.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="widthCm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Largura (cm)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
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
                          ? null
                          : Number(event.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="heightCm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Altura (cm)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
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
                          ? null
                          : Number(event.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lengthCm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comprimento (cm)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
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
                          ? null
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

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="deliveryDaysMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prazo mínimo (dias úteis)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    className="rounded-xl"
                    placeholder="Ex: 3"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    disabled={field.disabled}
                    value={typeof field.value === "number" ? field.value : ""}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deliveryDaysMax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prazo máximo (dias úteis)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    className="rounded-xl"
                    placeholder="Ex: 7"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    disabled={field.disabled}
                    value={typeof field.value === "number" ? field.value : ""}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value === ""
                          ? null
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
                <div className="relative">
                  <ImageIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input className="rounded-xl pl-9" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="videoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vídeo do produto (opcional)</FormLabel>
              <FormControl>
                <Input
                  className="rounded-xl"
                  placeholder="https://www.youtube.com/watch?v=... ou .mp4"
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
          name="isVerified"
          render={({ field }) => (
            <FormItem className="border-border/60 flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <FormLabel className="text-sm font-medium">
                  Fornecedor verificado
                </FormLabel>
                <p className="text-muted-foreground text-xs">
                  Exibe o selo de verificação na página do produto
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* ── Promoção ──────────────────────────────────── */}
        <Separator />
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Promoção</h3>

          <div className="grid gap-5 md:grid-cols-3">
            <FormField
              control={form.control}
              name="discountPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desconto (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="99"
                      step="1"
                      className="rounded-xl"
                      placeholder="Ex: 10"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      disabled={field.disabled}
                      value={
                        field.value != null && field.value !== undefined
                          ? String(field.value)
                          : ""
                      }
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="badgeLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Badge (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-xl"
                      placeholder="Ex: LANÇAMENTO"
                      maxLength={20}
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
              name="pixDiscountText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texto PIX (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-xl"
                      placeholder="Ex: Economize 10% via PIX"
                      maxLength={255}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {watchedDiscountPercent &&
            watchedDiscountPercent >= 1 &&
            watchedPriceInReais > 0 && (
              <div className="rounded-xl border bg-muted/30 px-4 py-3">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Preview do preço
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="text-muted-foreground line-through text-sm">
                    R${" "}
                    {(watchedPriceInReais).toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-xl font-bold">
                    R${" "}
                    {(
                      watchedPriceInReais *
                      (1 - watchedDiscountPercent / 100)
                    )
                      .toFixed(2)
                      .replace(".", ",")}
                  </span>
                  <Badge className="text-xs">-{watchedDiscountPercent}%</Badge>
                </div>
              </div>
            )}
        </div>

        {/* ── Personalização ────────────────────────────── */}
        <Separator />
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Personalização</h3>

          <FormField
            control={form.control}
            name="isCustomizable"
            render={({ field }) => (
              <FormItem className="border-border/60 flex items-center justify-between rounded-xl border px-4 py-3">
                <div>
                  <FormLabel className="text-sm font-medium">
                    Permitir personalização
                  </FormLabel>
                  <p className="text-muted-foreground text-xs">
                    Nome, número e patches selecionáveis pelo cliente
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {watchedIsCustomizable && (
            <div className="space-y-4 rounded-2xl border border-dashed p-4">
              <FormField
                control={form.control}
                name="customizationLeadDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo adicional (dias)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        className="w-32 rounded-xl"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        disabled={field.disabled}
                        value={
                          typeof field.value === "number" ? field.value : ""
                        }
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? 0
                              : Number(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Name field */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="nameFieldEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 text-sm">
                        Campo Nome
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nameFieldPriceInReais"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Valor adicional (R$)
                      </FormLabel>
                      <FormControl>
                        <NumericFormat
                          customInput={Input}
                          className="w-36 rounded-xl"
                          prefix="R$ "
                          decimalSeparator=","
                          thousandSeparator="."
                          decimalScale={2}
                          fixedDecimalScale
                          value={field.value ?? 0}
                          onValueChange={(v) =>
                            field.onChange(v.floatValue ?? 0)
                          }
                          onBlur={field.onBlur}
                          getInputRef={field.ref}
                          name={field.name}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Number field */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="numberFieldEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 text-sm">
                        Campo Número
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numberFieldPriceInReais"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Valor adicional (R$)
                      </FormLabel>
                      <FormControl>
                        <NumericFormat
                          customInput={Input}
                          className="w-36 rounded-xl"
                          prefix="R$ "
                          decimalSeparator=","
                          thousandSeparator="."
                          decimalScale={2}
                          fixedDecimalScale
                          value={field.value ?? 0}
                          onValueChange={(v) =>
                            field.onChange(v.floatValue ?? 0)
                          }
                          onBlur={field.onBlur}
                          getInputRef={field.ref}
                          name={field.name}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Patches */}
              <div className="space-y-3">
                <p className="text-sm font-medium">Patches / Escudos</p>
                <div className="space-y-3">
                  {patchFields.map((patchField, index) => (
                    <div
                      key={patchField.id}
                      className="grid gap-3 rounded-2xl border p-3 md:grid-cols-[1fr_1fr_120px_auto]"
                    >
                      <FormField
                        control={form.control}
                        name={`patches.${index}.label`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Label</FormLabel>
                            <FormControl>
                              <Input
                                className="rounded-xl"
                                placeholder="Ex: Escudo São Paulo"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`patches.${index}.imageUrl`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Imagem (URL)</FormLabel>
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
                      <FormField
                        control={form.control}
                        name={`patches.${index}.priceInCents`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Valor (R$)</FormLabel>
                            <FormControl>
                              <NumericFormat
                                customInput={Input}
                                className="rounded-xl"
                                prefix="R$ "
                                decimalSeparator=","
                                thousandSeparator="."
                                decimalScale={2}
                                fixedDecimalScale
                                value={(field.value ?? 0) / 100}
                                onValueChange={(v) =>
                                  field.onChange(
                                    Math.round((v.floatValue ?? 0) * 100),
                                  )
                                }
                                onBlur={field.onBlur}
                                getInputRef={field.ref}
                                name={field.name}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removePatch(index)}
                        >
                          <TrashIcon className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() =>
                    appendPatch({
                      id: crypto.randomUUID(),
                      label: "",
                      imageUrl: "",
                      priceInCents: 0,
                    })
                  }
                >
                  + Adicionar patch
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button type="submit" className="rounded-xl" disabled={isPending}>
            {mode === "create" ? "Salvar produto" : "Salvar alteracoes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
