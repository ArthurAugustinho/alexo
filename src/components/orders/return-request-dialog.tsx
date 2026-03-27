"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ImageIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";

import { createReturnRequest } from "@/actions/create-return-request";
import {
  type CreateReturnRequestInput,
  createReturnRequestSchema,
} from "@/actions/create-return-request/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { OrderWithItems } from "@/lib/queries/orders";

const REASON_OPTIONS = [
  { value: "defect", label: "Produto com defeito" },
  { value: "wrong_item", label: "Produto errado recebido" },
  { value: "damaged", label: "Produto danificado na entrega" },
  { value: "wrong_size", label: "Tamanho incorreto" },
  { value: "other", label: "Outros assuntos" },
] as const;

export const REASON_LABELS: Record<string, string> = {
  defect: "Produto com defeito",
  wrong_item: "Produto errado recebido",
  damaged: "Produto danificado na entrega",
  wrong_size: "Tamanho incorreto",
  other: "Outros assuntos",
};

type Props = {
  order: OrderWithItems;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReturnRequestDialog({ order, open, onOpenChange }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isUploading, setIsUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const shortId = order.id.slice(0, 8).toUpperCase();

  const formResolver = zodResolver(createReturnRequestSchema) as Resolver<
    CreateReturnRequestInput,
    unknown,
    CreateReturnRequestInput
  >;

  const form = useForm<CreateReturnRequestInput, unknown, CreateReturnRequestInput>({
    resolver: formResolver,
    defaultValues: {
      orderId: order.id,
      reason: undefined,
      description: "",
      photoUrl: "",
    },
  });

  const description = form.watch("description");

  async function handleNextFromStep1() {
    const valid = await form.trigger("reason");
    if (valid) setStep(2);
  }

  async function handleNextFromStep2() {
    const valid = await form.trigger("description");
    if (valid) setStep(3);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/return-photo", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        toast.error(data.error ?? "Erro ao fazer upload da foto.");
        return;
      }
      const { url } = (await res.json()) as { url: string };
      form.setValue("photoUrl", url);
      setPhotoPreview(url);
    } catch {
      toast.error("Erro ao fazer upload da foto.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  function handleRemovePhoto() {
    form.setValue("photoUrl", "");
    setPhotoPreview(null);
  }

  async function handleSubmit() {
    const values = form.getValues();
    setIsSubmitting(true);
    try {
      const result = await createReturnRequest(values);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        void queryClient.invalidateQueries({ queryKey: ["orders"] });
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose(open: boolean) {
    if (!open) {
      setStep(1);
      form.reset();
      setPhotoPreview(null);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar devolução — Pedido #{shortId}</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={`rounded-full px-2 py-0.5 ${
                step === s
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-muted"
              }`}
            >
              {s === 1 ? "Motivo" : s === 2 ? "Detalhes" : "Confirmação"}
            </span>
          ))}
        </div>

        <Form {...form}>
          <form className="space-y-4">
            {/* STEP 1 — Reason */}
            {step === 1 && (
              <>
                <p className="text-sm font-medium">Por que você quer devolver?</p>
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="space-y-2"
                        >
                          {REASON_OPTIONS.map((opt) => (
                            <label
                              key={opt.value}
                              className="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                            >
                              <RadioGroupItem value={opt.value} />
                              {opt.label}
                            </label>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="button" onClick={handleNextFromStep1}>
                    Continuar →
                  </Button>
                </div>
              </>
            )}

            {/* STEP 2 — Description + Photo */}
            {step === 2 && (
              <>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conte-nos mais sobre o problema</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o problema com detalhes..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <div className="text-muted-foreground text-right text-xs">
                        {description.length}/2000
                        {description.length < 20 && (
                          <span className="ml-1 text-destructive">
                            (mín. 20)
                          </span>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Photo upload */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Foto do problema{" "}
                    <span className="text-muted-foreground font-normal">(opcional)</span>
                  </p>

                  {photoPreview ? (
                    <div className="relative inline-block">
                      <div className="relative size-24 overflow-hidden rounded-lg border">
                        <Image
                          src={photoPreview}
                          alt="Foto do problema"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="bg-destructive text-destructive-foreground absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full"
                      >
                        <XIcon className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground hover:bg-muted/40 transition-colors disabled:opacity-50"
                    >
                      <ImageIcon className="size-4" />
                      {isUploading ? "Enviando..." : "Selecionar arquivo (JPG/PNG/WebP, max 10MB)"}
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    ← Voltar
                  </Button>
                  <Button type="button" onClick={handleNextFromStep2}>
                    Continuar →
                  </Button>
                </div>
              </>
            )}

            {/* STEP 3 — Confirmation */}
            {step === 3 && (
              <>
                <div className="rounded-xl border bg-muted/40 p-4 space-y-2 text-sm">
                  <p className="font-medium mb-3">Resumo da solicitação</p>
                  <p>
                    <span className="text-muted-foreground">Pedido:</span>{" "}
                    <span className="font-medium">#{shortId}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Motivo:</span>{" "}
                    {REASON_LABELS[form.getValues("reason") ?? ""] ?? ""}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Descrição:</span>{" "}
                    {form.getValues("description")}
                  </p>
                  {photoPreview && (
                    <p>
                      <span className="text-muted-foreground">Foto:</span>{" "}
                      <span className="text-emerald-600">✓ Anexada</span>
                    </p>
                  )}
                </div>

                <div className="rounded-xl border p-3 text-xs text-muted-foreground space-y-1">
                  <p>⏱ Prazo de análise: até 3 dias úteis</p>
                  <p>📧 Você receberá uma resposta por e-mail</p>
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                  >
                    ← Voltar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Enviando..." : "Enviar solicitação"}
                  </Button>
                </div>
              </>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
