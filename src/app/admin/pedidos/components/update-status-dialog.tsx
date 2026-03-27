"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { type Resolver,useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { updateOrderStatus } from "@/actions/update-order-status";
import {
  type UpdateOrderStatusInput,
  updateOrderStatusSchema,
} from "@/actions/update-order-status/schema";
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
import { Textarea } from "@/components/ui/textarea";
import type { AdminOrderRow } from "@/lib/queries/orders";

const STATUS_OPTIONS = [
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregue" },
  { value: "canceled", label: "Cancelado" },
  { value: "refunded", label: "Reembolsado" },
] as const;

type Props = {
  order: AdminOrderRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UpdateStatusDialog({ order, open, onOpenChange }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const formResolver = zodResolver(updateOrderStatusSchema) as Resolver<
    UpdateOrderStatusInput,
    unknown,
    UpdateOrderStatusInput
  >;

  const form = useForm<UpdateOrderStatusInput, unknown, UpdateOrderStatusInput>({
    resolver: formResolver,
    defaultValues: {
      orderId: order.id,
      status: "shipped",
      trackingCode: order.trackingCode ?? "",
      trackingUrl: order.trackingUrl ?? "",
      statusNote: order.statusNote ?? "",
    },
  });

  const selectedStatus = useWatch({ control: form.control, name: "status" });
  const showTracking = selectedStatus === "shipped";

  function onSubmit(data: UpdateOrderStatusInput) {
    startTransition(async () => {
      const result = await updateOrderStatus(data);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  const shortId = order.id.slice(0, 8).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atualizar pedido #{shortId}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Novo status</FormLabel>
                  <FormControl>
                    <select
                      className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                      {...field}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showTracking && (
              <>
                <FormField
                  control={form.control}
                  name="trackingCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de rastreamento</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="AB123456789BR"
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
                  name="trackingUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de rastreamento</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://www.correios.com.br/..."
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
              name="statusNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota interna (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações sobre este status..."
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
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
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
