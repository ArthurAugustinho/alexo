"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  MailIcon,
  MessageCircleIcon,
  PhoneIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { sendContactEmail } from "@/actions/send-contact-email";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import type { SupportWidgetConfig } from "@/lib/queries/support-widget";

const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome deve ter no mínimo 2 caracteres.")
    .max(100),
  email: z.string().trim().email("E-mail inválido."),
  subject: z
    .string()
    .trim()
    .min(1, "Informe o assunto.")
    .max(100, "Máximo 100 caracteres."),
  message: z
    .string()
    .trim()
    .min(10, "A mensagem deve ter no mínimo 10 caracteres.")
    .max(2000, "Máximo 2000 caracteres."),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

type SupportWidgetProps = {
  config: SupportWidgetConfig;
};

export function SupportWidget({ config }: SupportWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isSending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const whatsappUrl = config.whatsappNumber
    ? `https://wa.me/${config.whatsappNumber}${
        config.whatsappMessage
          ? `?text=${encodeURIComponent(config.whatsappMessage)}`
          : ""
      }`
    : null;

  const hasWhatsapp = Boolean(whatsappUrl);
  const hasEmail = Boolean(config.supportEmail);

  function handleEmailClick() {
    setIsOpen(false);
    setIsEmailOpen(true);
  }

  function onSubmit(values: ContactFormValues) {
    startTransition(async () => {
      const result = await sendContactEmail(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success("Mensagem enviada! Retornaremos em breve.");
      setIsEmailOpen(false);
      form.reset();
    });
  }

  return (
    <>
      <div
        ref={containerRef}
        className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3"
      >
        {/* Menu expandido */}
        {isOpen && (
          <div
            role="dialog"
            aria-label="Menu de atendimento"
            className="w-64 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-[#25D366] px-4 py-3">
              <p className="text-sm font-medium text-white">
                Como posso ajudar?
              </p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar menu"
                className="text-white/80 transition-colors hover:text-white"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            {/* Opções */}
            <div className="flex flex-col gap-1 p-2">
              {hasWhatsapp && whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#25D366]">
                    <PhoneIcon className="size-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Falar no WhatsApp
                    </p>
                    <p className="text-xs text-gray-500">Atendimento rápido</p>
                  </div>
                </a>
              )}

              {hasEmail && (
                <button
                  type="button"
                  onClick={handleEmailClick}
                  className="flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
                    <MailIcon className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Enviar email
                    </p>
                    <p className="text-xs text-gray-500">
                      Respondemos em até 24h
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Botão principal */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Atendimento ao cliente"
          aria-expanded={isOpen}
          className="flex size-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <MessageCircleIcon className="size-6 text-white" />
        </button>
      </div>

      {/* Dialog de email */}
      <Dialog
        open={isEmailOpen}
        onOpenChange={(open) => {
          setIsEmailOpen(open);
          if (!open) form.reset();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar mensagem</DialogTitle>
            <DialogDescription>
              Preencha o formulário e responderemos em até 24 horas.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assunto</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Como posso ajudar?"
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
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva sua dúvida ou problema..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isSending}
              >
                {isSending ? "Enviando..." : "Enviar mensagem"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
