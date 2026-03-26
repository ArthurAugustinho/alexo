"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  MailIcon,
  MessageCircleIcon,
  PhoneIcon,
  XIcon,
} from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { upsertSupportWidget } from "@/actions/upsert-support-widget";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { SupportWidgetConfig } from "@/lib/queries/support-widget";

const formSchema = z
  .object({
    isActive: z.boolean(),
    whatsappNumber: z
      .string()
      .regex(
        /^\d{10,15}$/,
        "Apenas dígitos com DDI, ex: 5511999999999 (10–15 dígitos)",
      )
      .or(z.literal(""))
      .optional(),
    whatsappMessage: z.string().max(255).or(z.literal("")).optional(),
    supportEmail: z
      .string()
      .email("E-mail inválido.")
      .or(z.literal(""))
      .optional(),
  })
  .refine(
    (data) => {
      if (!data.isActive) return true;
      return (
        Boolean(data.whatsappNumber?.trim()) ||
        Boolean(data.supportEmail?.trim())
      );
    },
    {
      message:
        "Para ativar o widget, informe ao menos o WhatsApp ou o email de suporte.",
      path: ["isActive"],
    },
  );

type FormValues = z.infer<typeof formSchema>;

type SupportWidgetConfigFormProps = {
  initialConfig: SupportWidgetConfig | null;
};

export function SupportWidgetConfigForm({
  initialConfig,
}: SupportWidgetConfigFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isActive: initialConfig?.isActive ?? true,
      whatsappNumber: initialConfig?.whatsappNumber ?? "",
      whatsappMessage:
        initialConfig?.whatsappMessage ??
        "Olá! Preciso de ajuda com meu pedido.",
      supportEmail: initialConfig?.supportEmail ?? "",
    },
  });

  const watchedValues = form.watch();
  const hasWhatsapp = Boolean(watchedValues.whatsappNumber?.trim());
  const hasEmail = Boolean(watchedValues.supportEmail?.trim());

  const whatsappUrl = hasWhatsapp
    ? `https://wa.me/${watchedValues.whatsappNumber}${
        watchedValues.whatsappMessage?.trim()
          ? `?text=${encodeURIComponent(watchedValues.whatsappMessage)}`
          : ""
      }`
    : null;

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await upsertSupportWidget(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Formulário */}
      <Card className="border-border/70 bg-background/95 rounded-3xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Widget de atendimento</CardTitle>
          <CardDescription>
            Configure o botão flutuante de atendimento exibido na loja.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 rounded-2xl border p-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-0.5">
                      <FormLabel className="!mt-0 cursor-pointer text-base">
                        Widget ativo
                      </FormLabel>
                      <FormDescription>
                        Quando desativado, o botão não aparece na loja.
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 rounded-2xl border p-4">
                <p className="text-sm font-medium">WhatsApp</p>

                <FormField
                  control={form.control}
                  name="whatsappNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do WhatsApp</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="5511999999999"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        DDI + DDD + número, apenas dígitos.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whatsappMessage"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Mensagem pré-definida</FormLabel>
                        <span className="text-muted-foreground text-xs">
                          {field.value?.length ?? 0}/255
                        </span>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Olá! Preciso de ajuda com meu pedido."
                          maxLength={255}
                          rows={2}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 rounded-2xl border p-4">
                <p className="text-sm font-medium">Email de suporte</p>

                <FormField
                  control={form.control}
                  name="supportEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de suporte</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="suporte@alexo.com.br"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Mensagens do formulário serão enviadas para este email.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl"
                disabled={isPending}
              >
                {isPending ? "Salvando..." : "Salvar configurações"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="border-border/70 bg-background/95 rounded-3xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Prévia</CardTitle>
          <CardDescription>
            Visualização em tempo real do widget na loja.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="relative flex h-80 items-end justify-end overflow-hidden rounded-2xl border bg-zinc-50 p-4">
            <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-zinc-400">
              Loja
            </p>

            {watchedValues.isActive && (hasWhatsapp || hasEmail) ? (
              <div className="flex flex-col items-end gap-2">
                {/* Menu preview */}
                <div className="w-52 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/5">
                  <div className="flex items-center justify-between bg-[#25D366] px-3 py-2">
                    <p className="text-xs font-medium text-white">
                      Como posso ajudar?
                    </p>
                    <XIcon className="size-3 text-white" />
                  </div>
                  <div className="flex flex-col gap-0.5 p-1.5">
                    {hasWhatsapp && whatsappUrl && (
                      <div className="flex items-center gap-2 rounded-lg p-2">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#25D366]">
                          <PhoneIcon className="size-3.5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-900">
                            Falar no WhatsApp
                          </p>
                          <p className="text-[10px] text-gray-500">
                            Atendimento rápido
                          </p>
                        </div>
                      </div>
                    )}
                    {hasEmail && (
                      <div className="flex items-center gap-2 rounded-lg p-2">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-50">
                          <MailIcon className="size-3.5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-900">
                            Enviar email
                          </p>
                          <p className="text-[10px] text-gray-500">
                            Respondemos em até 24h
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botão */}
                <div className="flex size-12 items-center justify-center rounded-full bg-[#25D366] shadow-md">
                  <MessageCircleIcon className="size-5 text-white" />
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">
                {!watchedValues.isActive
                  ? "Widget desativado"
                  : "Configure WhatsApp ou email para ver o preview"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
