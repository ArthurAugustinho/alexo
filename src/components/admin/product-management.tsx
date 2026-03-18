"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ImageIcon,
  PackagePlusIcon,
  PencilLineIcon,
  ShieldAlertIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  type AdminCategoryFormValues,
  type AdminCategoryInput,
  adminCategorySchema,
} from "@/actions/admin-category/schema";
import {
  type AdminProductFormValues,
  type AdminProductInput,
  adminProductSchema,
} from "@/actions/admin-product/schema";
import { createAdminCategory } from "@/actions/create-admin-category";
import { createAdminProduct } from "@/actions/create-admin-product";
import { deleteAdminCategory } from "@/actions/delete-admin-category";
import { deleteAdminProduct } from "@/actions/delete-admin-product";
import { updateAdminCategory } from "@/actions/update-admin-category";
import { updateAdminProduct } from "@/actions/update-admin-product";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type DashboardRole = "admin" | "super_admin";

export type AdminCatalogProduct = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  slug: string;
  shippingCostInCents: number;
  variantsCount: number;
  primaryVariant: {
    id: string;
    name: string;
    color: string;
    priceInCents: number;
    imageUrl: string;
  } | null;
};

export type AdminCatalogCategory = {
  id: string;
  name: string;
  slug: string;
  products: AdminCatalogProduct[];
};

type ProductManagementProps = {
  categories: AdminCatalogCategory[];
  role: DashboardRole;
};

type ProductEditorDialogProps = {
  categories: AdminCatalogCategory[];
  mode: "create" | "edit";
  product?: AdminCatalogProduct;
  trigger?: React.ReactNode;
};

type CategoryEditorDialogProps = {
  mode: "create" | "edit";
  category?: AdminCatalogCategory;
  trigger?: React.ReactNode;
};

function formatBRL(priceInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceInCents / 100);
}

function ProductEditorDialog({
  categories,
  mode,
  product,
  trigger,
}: ProductEditorDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const defaultValues = useMemo<AdminProductFormValues>(
    () => ({
      productId: product?.id,
      primaryVariantId: product?.primaryVariant?.id,
      name: product?.name ?? "",
      description: product?.description ?? "",
      categoryId: product?.categoryId ?? categories[0]?.id ?? "",
      variantName: product?.primaryVariant?.name ?? "",
      variantColor: product?.primaryVariant?.color ?? "",
      priceInReais: product?.primaryVariant
        ? product.primaryVariant.priceInCents / 100
        : 0,
      shippingCostInReais: product ? product.shippingCostInCents / 100 : 0,
      imageUrl: product?.primaryVariant?.imageUrl ?? "",
    }),
    [categories, product],
  );

  const form = useForm<AdminProductFormValues, unknown, AdminProductInput>({
    resolver: zodResolver(adminProductSchema),
    defaultValues,
  });
  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  function onSubmit(values: AdminProductInput) {
    startTransition(async () => {
      const action =
        mode === "create" ? createAdminProduct : updateAdminProduct;
      const result = await action(values);

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
            <PackagePlusIcon />
            Novo produto
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Adicionar produto" : "Editar produto"}
          </DialogTitle>
          <DialogDescription>
            Cadastre os dados principais do produto e a variação de destaque.
          </DialogDescription>
        </DialogHeader>

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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
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

            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="variantName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da variação</FormLabel>
                    <FormControl>
                      <Input
                        className="rounded-xl"
                        placeholder="Ex: Preto / Padrão"
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
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="priceInReais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
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
                        value={
                          typeof field.value === "number" ? field.value : ""
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
                        value={
                          typeof field.value === "number" ? field.value : ""
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
                {mode === "create" ? "Salvar produto" : "Salvar alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CategoryEditorDialog({
  mode,
  category,
  trigger,
}: CategoryEditorDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const defaultValues = useMemo<AdminCategoryFormValues>(
    () => ({
      categoryId: category?.id,
      name: category?.name ?? "",
    }),
    [category],
  );

  const form = useForm<AdminCategoryFormValues, unknown, AdminCategoryInput>({
    resolver: zodResolver(adminCategorySchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  function onSubmit(values: AdminCategoryInput) {
    startTransition(async () => {
      const action =
        mode === "create" ? createAdminCategory : updateAdminCategory;
      const result = await action(values);

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
            <TagIcon />
            Nova categoria
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Adicionar categoria" : "Editar categoria"}
          </DialogTitle>
          <DialogDescription>
            Defina o nome da categoria. O slug é atualizado automaticamente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da categoria</FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-xl"
                      placeholder="Ex: Camisetas"
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
                {mode === "create" ? "Salvar categoria" : "Salvar alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCategoryDialog({ categoryId }: { categoryId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAdminCategory({ categoryId });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl">
          <Trash2Icon />
          Excluir
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir categoria</DialogTitle>
          <DialogDescription>
            Esta ação remove a categoria apenas se ela não possuir produtos
            vinculados.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="rounded-xl">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            className="rounded-xl"
            onClick={handleDelete}
            disabled={isPending}
          >
            Confirmar exclusão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteProductDialog({ productId }: { productId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAdminProduct({ productId });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl">
          <Trash2Icon />
          Excluir
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir produto</DialogTitle>
          <DialogDescription>
            Esta ação remove o produto e suas variações. Se ele já estiver em
            pedidos, a exclusão será bloqueada.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="rounded-xl">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            className="rounded-xl"
            onClick={handleDelete}
            disabled={isPending}
          >
            Confirmar exclusão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CategoryManagement({
  categories,
  role,
}: ProductManagementProps) {
  return (
    <Card className="border-border/70 bg-background/95 rounded-3xl shadow-sm">
      <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-2xl">Gestão de Categorias</CardTitle>
          <CardDescription>
            Crie, edite e organize as categorias que estruturam o catálogo.
          </CardDescription>
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          {role === "super_admin" ? (
            <Badge>Super admin com acesso total</Badge>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <ShieldAlertIcon className="size-4" />
              Exclusão restrita ao super admin.
            </div>
          )}
          <CategoryEditorDialog mode="create" />
        </div>
      </CardHeader>

      <CardContent>
        {categories.length === 0 ? (
          <div className="rounded-3xl border border-dashed px-6 py-12 text-center text-muted-foreground">
            Nenhuma categoria cadastrada ainda. Crie a primeira para começar o
            catálogo.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="border-border/70 bg-muted/20 space-y-4 rounded-3xl border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                      <TagIcon className="size-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <h3 className="truncate text-lg font-semibold">
                        {category.name}
                      </h3>
                      <p className="text-muted-foreground truncate text-xs">
                        /{category.slug}
                      </p>
                    </div>
                  </div>

                  <Badge variant="secondary">
                    {category.products.length}{" "}
                    {category.products.length === 1 ? "produto" : "produtos"}
                  </Badge>
                </div>

                <div className="rounded-2xl border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                  {category.products.length > 0
                    ? "Categoria ativa no catálogo e disponível para novos produtos."
                    : "Categoria criada e pronta para receber produtos."}
                </div>

                <div className="flex flex-wrap gap-2">
                  <CategoryEditorDialog
                    mode="edit"
                    category={category}
                    trigger={
                      <Button variant="outline" size="sm" className="rounded-xl">
                        <PencilLineIcon />
                        Editar
                      </Button>
                    }
                  />
                  {role === "super_admin" ? (
                    <DeleteCategoryDialog categoryId={category.id} />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ProductManagement({
  categories,
  role,
}: ProductManagementProps) {
  const defaultTab = categories[0]?.slug ?? "produtos";
  const totalProducts = categories.reduce(
    (total, category) => total + category.products.length,
    0,
  );
  const ribbonAccents = [
    "bg-[#efe3ff] text-[#6d46c8]",
    "bg-[#ffe7d6] text-[#c46a1d]",
    "bg-[#daf7ea] text-[#13795b]",
    "bg-[#dcecff] text-[#2958b8]",
  ];

  return (
    <Card className="border-border/70 bg-background/95 rounded-3xl shadow-sm">
      <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-2xl">Gestão de Produtos</CardTitle>
          <CardDescription>
            Organize o catálogo por categoria, adicione novidades e mantenha a
            vitrine atualizada.
          </CardDescription>
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          {role === "super_admin" ? (
            <Badge>Super admin com acesso total</Badge>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <ShieldAlertIcon className="size-4" />
              Exclusão restrita ao super admin.
            </div>
          )}
          {categories.length > 0 ? (
            <ProductEditorDialog categories={categories} mode="create" />
          ) : (
            <Button className="rounded-xl" disabled>
              <PackagePlusIcon />
              Novo produto
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {categories.length === 0 ? (
          <div className="rounded-3xl border border-dashed px-6 py-12 text-center text-muted-foreground">
            Crie uma categoria antes de cadastrar produtos no catÃ¡logo.
          </div>
        ) : (
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <div className="snap-x snap-mandatory overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="inline-flex min-w-full items-center gap-2 rounded-full border border-[#eadfff] bg-[linear-gradient(90deg,_rgba(244,239,255,0.96),_rgba(255,255,255,0.96))] p-2 shadow-[0_14px_32px_rgba(123,97,196,0.10)]">
              <div className="flex shrink-0 items-center gap-2 rounded-full bg-white/90 px-3 py-2 shadow-[0_8px_18px_rgba(123,97,196,0.10)]">
                <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.2em]">
                  Categorias
                </span>
                <Badge variant="outline" className="rounded-full px-2.5 py-0.5">
                  {categories.length}
                </Badge>
                <Badge
                  variant="secondary"
                  className="rounded-full px-2.5 py-0.5"
                >
                  {totalProducts} produtos
                </Badge>
              </div>

              <TabsList className="flex h-auto min-w-max flex-nowrap items-center gap-2 bg-transparent p-0 shadow-none">
              {categories.map((category, index) => {
                const accent = ribbonAccents[index % ribbonAccents.length];
                const productLabel =
                  category.products.length === 1 ? "produto" : "produtos";

                return (
                  <TabsTrigger
                    key={category.id}
                    value={category.slug}
                    className={cn(
                      "h-12 snap-start flex-none rounded-full border border-white/80 bg-white/78 px-3.5 py-2 text-left whitespace-nowrap shadow-[0_8px_18px_rgba(107,89,164,0.08)] transition-all duration-200 hover:-translate-y-0.5 data-[state=active]:border-primary/15 data-[state=active]:bg-white data-[state=active]:shadow-[0_14px_28px_rgba(111,76,196,0.16)]",
                    )}
                  >
                    <div className="flex w-full items-center gap-2.5">
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                          accent,
                        )}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <p className="text-foreground text-sm font-semibold">
                          {category.name}
                        </p>
                        <span className="text-muted-foreground text-xs">
                          {category.products.length} {productLabel}
                        </span>
                      </div>
                    </div>
                  </TabsTrigger>
                );
              })}
              </TabsList>
            </div>
          </div>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.slug} className="mt-0">
              {category.products.length === 0 ? (
                <div className="rounded-3xl border border-dashed px-6 py-12 text-center text-muted-foreground">
                  Nenhum produto cadastrado nessa categoria ainda.
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {category.products.map((product) => (
                    <div
                      key={product.id}
                      className="border-border/70 bg-muted/20 grid gap-4 rounded-3xl border p-4 sm:grid-cols-[140px_1fr]"
                    >
                      <div className="overflow-hidden rounded-2xl bg-muted">
                        {product.primaryVariant?.imageUrl ? (
                          <img
                            src={product.primaryVariant.imageUrl}
                            alt={product.name}
                            className="h-full min-h-36 w-full object-cover"
                          />
                        ) : (
                          <div className="flex min-h-36 items-center justify-center">
                            <ImageIcon className="text-muted-foreground size-6" />
                          </div>
                        )}
                      </div>

                      <div className="flex min-w-0 flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold">{product.name}</h3>
                            <Badge variant="secondary">
                              {product.variantsCount} variações
                            </Badge>
                          </div>
                          <p className="text-muted-foreground line-clamp-3 text-sm">
                            {product.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-end justify-between gap-3">
                          <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">
                              Variação de destaque
                            </p>
                            <p className="text-sm font-medium">
                              {product.primaryVariant?.name ?? "Sem variação"}
                              {product.primaryVariant?.color
                                ? ` • ${product.primaryVariant.color}`
                                : ""}
                            </p>
                            <p className="text-lg font-semibold">
                              {product.primaryVariant
                                ? formatBRL(product.primaryVariant.priceInCents)
                                : "Preço não definido"}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              Frete:{" "}
                              {product.shippingCostInCents > 0
                                ? formatBRL(product.shippingCostInCents)
                                : "Grátis"}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <ProductEditorDialog
                              categories={categories}
                              mode="edit"
                              product={product}
                              trigger={
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={cn("rounded-xl")}
                                >
                                  <PencilLineIcon />
                                  Editar
                                </Button>
                              }
                            />
                            {role === "super_admin" ? (
                              <DeleteProductDialog productId={product.id} />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
