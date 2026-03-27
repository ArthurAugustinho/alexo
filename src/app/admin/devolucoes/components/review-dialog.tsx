"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { type Resolver, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { reviewReturnRequest } from "@/actions/review-return-request";
import {
  type ReviewReturnRequestInput,
  reviewReturnRequestSchema,
} from "@/actions/review-return-request/schema";
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
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { ReturnRequestWithOrder } from "@/lib/queries/return-requests";

type Props = {
  request: ReturnRequestWithOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReviewDialog({ request, open, onOpenChange }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const formResolver = zodResolver(reviewReturnRequestSchema) as Resolver<
    ReviewReturnRequestInput,
    unknown,
    ReviewReturnRequestInput
  >;

  const form = useForm<ReviewReturnRequestInput, unknown, ReviewReturnRequestInput>({
    resolver: formResolver,
    defaultValues: {
      returnRequestId: request.id,
      status: "approved",
      adminNote: "",
      returnCode: "",
      returnUrl: "",
    },
  });

  const selectedStatus = useWatch({ control: form.control, name: "status" });
  const isApproved = selectedStatus === "approved";

  function onSubmit(data: ReviewReturnRequestInput) {
    startTransition(async () => {
      const result = await reviewReturnRequest(data);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  const shortOrderId = request.orderId.slice(0, 8).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Analisar devolução — Pedido #{shortOrderId}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Decisão</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-4"
                    >
                      <label className="flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm has-[[data-state=checked]]:border-emerald-500 has-[[data-state=checked]]:bg-emerald-50">
                        <RadioGroupItem value="approved" />
                        Aprovar
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm has-[[data-state=checked]]:border-destructive has-[[data-state=checked]]:bg-destructive/5">
                        <RadioGroupItem value="rejected" />
                        Rejeitar
                      </label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isApproved && (
              <>
                <FormField
                  control={form.control}
                  name="returnCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de postagem</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Código para devolução dos Correios"
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
                  name="returnUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        URL de instruções{" "}
                        <span className="text-muted-foreground font-normal">(opcional)</span>
                      </FormLabel>
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
              </>
            )}

            <FormField
              control={form.control}
              name="adminNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem ao cliente</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        isApproved
                          ? "Instruções para envio do produto..."
                          : "Motivo da rejeição..."
                      }
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : "Confirmar decisão"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
