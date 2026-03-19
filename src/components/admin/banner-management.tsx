"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarRangeIcon,
  ExternalLinkIcon,
  ImageIcon,
  PencilLineIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Textarea } from "@/components/ui/textarea";
import {
  createAdminBanner,
  deleteAdminBanner,
  updateAdminBanner,
} from "@/lib/actions/banners";
import {
  type AdminBannerFormValues,
  type AdminBannerInput,
  type AdminBannerListItem,
  adminBannerSchema,
} from "@/lib/admin-showcase-schema";
import { cn } from "@/lib/utils";

type BannerManagementProps = {
  banners: AdminBannerListItem[];
};

function toDateTimeLocalValue(date: Date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getBannerStatus(banner: AdminBannerListItem) {
  const currentDate = new Date();

  if (banner.startDate > currentDate) {
    return {
      label: "Agendado",
      className: "bg-sky-100 text-sky-700 border-transparent",
    };
  }

  if (banner.endDate < currentDate) {
    return {
      label: "Expirado",
      className: "bg-slate-200 text-slate-700 border-transparent",
    };
  }

  return {
    label: "Vigente",
    className: "bg-emerald-100 text-emerald-700 border-transparent",
  };
}

type BannerEditorDialogProps = {
  banner?: AdminBannerListItem;
  mode: "create" | "edit";
  trigger?: React.ReactNode;
};

function BannerEditorDialog({
  banner,
  mode,
  trigger,
}: BannerEditorDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const defaultValues = useMemo<AdminBannerFormValues>(
    () => ({
      bannerId: banner?.id,
      imageUrl: banner?.imageUrl ?? "",
      title: banner?.title ?? "",
      subtitle: banner?.subtitle ?? "",
      linkUrl: banner?.linkUrl ?? "",
      startDate: banner ? toDateTimeLocalValue(banner.startDate) : "",
      endDate: banner ? toDateTimeLocalValue(banner.endDate) : "",
    }),
    [banner],
  );

  const form = useForm<AdminBannerFormValues, unknown, AdminBannerInput>({
    resolver: zodResolver(adminBannerSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  function onSubmit(values: AdminBannerInput) {
    startTransition(async () => {
      const action = mode === "create" ? createAdminBanner : updateAdminBanner;
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
            <PlusIcon />
            Novo banner
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Criar banner" : "Editar banner"}
          </DialogTitle>
          <DialogDescription>
            Cadastre os dados visuais, o link e a janela de vigência do banner.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input className="rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link</FormLabel>
                    <FormControl>
                      <Input
                        className="rounded-xl"
                        placeholder="/category/camisetas"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtítulo</FormLabel>
                  <FormControl>
                    <Textarea className="rounded-2xl" rows={4} {...field} />
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

            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Início da vigência</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        className="rounded-xl"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        disabled={field.disabled}
                        value={typeof field.value === "string" ? field.value : ""}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fim da vigência</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        className="rounded-xl"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        disabled={field.disabled}
                        value={typeof field.value === "string" ? field.value : ""}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {mode === "create" ? "Salvar banner" : "Salvar alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteBannerDialog({ bannerId }: { bannerId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const result = await deleteAdminBanner({ bannerId });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="rounded-xl">
          <Trash2Icon />
          Excluir
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir banner</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação remove o banner da vitrine. Confirme apenas se tiver
            certeza de que deseja excluir este item.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={isPending} onClick={onDelete}>
            Excluir banner
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function BannerManagement({ banners }: BannerManagementProps) {
  return (
    <Card className="border-border/70 bg-background/95 rounded-3xl shadow-sm">
      <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-2xl">Banners sazonais</CardTitle>
          <CardDescription>
            Gerencie a vitrine principal da home com janelas de vigência e links
            promocionais.
          </CardDescription>
        </div>

        <BannerEditorDialog mode="create" />
      </CardHeader>

      <CardContent>
        {banners.length === 0 ? (
          <div className="rounded-3xl border border-dashed px-6 py-12 text-center text-muted-foreground">
            Nenhum banner cadastrado ainda.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 font-medium">Banner</th>
                    <th className="px-4 py-3 font-medium">Período</th>
                    <th className="px-4 py-3 font-medium">Link</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Atualizado</th>
                    <th className="px-4 py-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {banners.map((banner) => {
                    const status = getBannerStatus(banner);

                    return (
                      <tr
                        key={banner.id}
                        className="border-t align-top transition-colors hover:bg-muted/20"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            <div className="relative size-20 overflow-hidden rounded-2xl bg-muted">
                              {banner.imageUrl ? (
                                <Image
                                  src={banner.imageUrl}
                                  alt={`Banner ${banner.title}`}
                                  fill
                                  sizes="80px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <ImageIcon className="text-muted-foreground size-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 space-y-1">
                              <p className="font-semibold">{banner.title}</p>
                              <p className="text-muted-foreground line-clamp-2 max-w-sm">
                                {banner.subtitle}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-muted-foreground space-y-1">
                            <p className="inline-flex items-center gap-2 font-medium text-foreground">
                              <CalendarRangeIcon className="size-4" />
                              {formatDateTime(banner.startDate)}
                            </p>
                            <p>até {formatDateTime(banner.endDate)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <a
                            href={banner.linkUrl}
                            target={
                              banner.linkUrl.startsWith("http")
                                ? "_blank"
                                : undefined
                            }
                            rel={
                              banner.linkUrl.startsWith("http")
                                ? "noreferrer"
                                : undefined
                            }
                            className="inline-flex max-w-[200px] items-center gap-2 text-primary hover:underline"
                          >
                            <span className="truncate">{banner.linkUrl}</span>
                            <ExternalLinkIcon className="size-4" />
                          </a>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={cn("rounded-full", status.className)}>
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {formatDateTime(banner.updatedAt)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <BannerEditorDialog
                              mode="edit"
                              banner={banner}
                              trigger={
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-xl"
                                >
                                  <PencilLineIcon />
                                  Editar
                                </Button>
                              }
                            />
                            <DeleteBannerDialog bannerId={banner.id} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
