"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createFaqItem } from "@/actions/create-faq-item";
import { updateFaqItem } from "@/actions/update-faq-item";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { FaqItem } from "@/lib/queries/faq";

const faqFormSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Informe a pergunta.")
    .max(300, "Máximo 300 caracteres."),
  answer: z.string().trim().min(1, "Informe a resposta."),
  isActive: z.boolean(),
});

type FaqFormValues = z.infer<typeof faqFormSchema>;

type FaqFormProps = {
  item?: FaqItem | null;
  onSuccess: () => void;
};

export function FaqForm({ item, onSuccess }: FaqFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(item);

  const form = useForm<FaqFormValues>({
    resolver: zodResolver(faqFormSchema),
    defaultValues: {
      question: item?.question ?? "",
      answer: item?.answer ?? "",
      isActive: item?.isActive ?? true,
    },
  });

  const questionLength = form.watch("question")?.length ?? 0;

  function onSubmit(values: FaqFormValues) {
    startTransition(async () => {
      const result =
        isEditing && item
          ? await updateFaqItem({ id: item.id, ...values })
          : await createFaqItem(values);

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
          {isEditing ? "Editar pergunta" : "Nova pergunta"}
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Edite a pergunta e resposta do FAQ."
            : "Adicione uma nova pergunta ao FAQ do footer."}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="question"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Pergunta</FormLabel>
                  <span className="text-muted-foreground text-xs">
                    {questionLength}/300
                  </span>
                </div>
                <FormControl>
                  <Textarea
                    placeholder="Qual é o prazo de entrega?"
                    maxLength={300}
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="answer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resposta</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Entregamos em até 7 dias úteis..."
                    rows={4}
                    {...field}
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
                : "Adicionar pergunta"}
          </Button>
        </form>
      </Form>
    </>
  );
}
