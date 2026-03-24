"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createAnnouncementBar } from "@/actions/create-announcement-bar";
import { updateAnnouncementBar } from "@/actions/update-announcement-bar";
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
  announcementBarFormSchema,
  type AnnouncementBarFormValues,
} from "@/lib/announcement-bar-schema";
import type { AnnouncementBar } from "@/lib/queries/announcement-bars";

import { AnnouncementBarPreview } from "./announcement-bar-preview";

type AnnouncementBarFormProps = {
  bar?: AnnouncementBar | null;
  onSuccess: () => void;
};

function toDateTimeLocal(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}

export function AnnouncementBarForm({ bar, onSuccess }: AnnouncementBarFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(bar);

  const form = useForm<AnnouncementBarFormValues>({
    resolver: zodResolver(announcementBarFormSchema),
    defaultValues: {
      text: bar?.text ?? "",
      linkUrl: bar?.linkUrl ?? "",
      bgColor: bar?.bgColor ?? "#000000",
      textColor: bar?.textColor ?? "#FFFFFF",
      isActive: bar?.isActive ?? true,
      startDate: bar?.startDate ? toDateTimeLocal(bar.startDate) : "",
      endDate: bar?.endDate ? toDateTimeLocal(bar.endDate) : "",
    },
  });

  const watchedText = form.watch("text");
  const watchedBgColor = form.watch("bgColor");
  const watchedTextColor = form.watch("textColor");
  const watchedLinkUrl = form.watch("linkUrl");

  function onSubmit(values: AnnouncementBarFormValues) {
    startTransition(async () => {
      const startDate = values.startDate
        ? new Date(values.startDate).toISOString()
        : null;
      const endDate = values.endDate
        ? new Date(values.endDate).toISOString()
        : null;

      const payload = {
        text: values.text,
        linkUrl: values.linkUrl,
        bgColor: values.bgColor,
        textColor: values.textColor,
        isActive: values.isActive ?? true,
        startDate,
        endDate,
      };

      const result = isEditing && bar
        ? await updateAnnouncementBar({ id: bar.id, ...payload })
        : await createAnnouncementBar(payload);

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
        <DialogTitle>{isEditing ? "Editar aviso" : "Novo aviso"}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Edite as informações do aviso da barra."
            : "Preencha as informações para criar um novo aviso."}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <AnnouncementBarPreview
            text={watchedText}
            bgColor={watchedBgColor}
            textColor={watchedTextColor}
            linkUrl={watchedLinkUrl}
          />

          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Texto</FormLabel>
                  <span className="text-muted-foreground text-xs">
                    {field.value?.length ?? 0}/255
                  </span>
                </div>
                <FormControl>
                  <Input
                    placeholder="Frete grátis acima de R$ 299"
                    maxLength={255}
                    {...field}
                  />
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
                <FormLabel>Link (opcional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://..."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="bgColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor de fundo</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="h-9 w-9 cursor-pointer rounded border p-1"
                      />
                      <Input
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        maxLength={7}
                        className="font-mono uppercase"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="textColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor do texto</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="h-9 w-9 cursor-pointer rounded border p-1"
                      />
                      <Input
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        maxLength={7}
                        className="font-mono uppercase"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Início da vigência (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
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
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fim da vigência (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
                : "Criar aviso"}
          </Button>
        </form>
      </Form>
    </>
  );
}
