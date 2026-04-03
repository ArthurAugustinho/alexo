"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { type Resolver, useForm, useWatch } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";

import { createCoupon } from "@/actions/create-coupon";
import { type CreateCouponInput, createCouponSchema } from "@/actions/create-coupon/schema";
import { updateCoupon } from "@/actions/update-coupon";
import { type UpdateCouponInput } from "@/actions/update-coupon/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Category } from "@/lib/queries/categories";
import type { CouponWithStats } from "@/lib/queries/coupons";

interface CouponFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: CouponWithStats | null;
  categories: Category[];
}

type FormInput = CreateCouponInput;

const defaultValues: FormInput = {
  code: "",
  description: "",
  type: "percentage",
  value: 0,
  categoryId: "",
  minOrderValueInCents: 0,
  maxDiscountInCents: undefined,
  maxUsesTotal: undefined,
  maxUsesPerUser: 1,
  isFirstOrderOnly: false,
  isActive: true,
  startsAt: "",
  expiresAt: "",
};

export function CouponFormDialog({
  open,
  onOpenChange,
  coupon,
  categories,
}: CouponFormDialogProps) {
  const isEditing = !!coupon;

  const form = useForm<FormInput>({
    resolver: zodResolver(createCouponSchema) as Resolver<FormInput>,
    defaultValues,
  });

  const selectedType = useWatch({ control: form.control, name: "type" });

  useEffect(() => {
    if (open) {
      if (coupon) {
        form.reset({
          code: coupon.code,
          description: coupon.description ?? "",
          type: coupon.type as FormInput["type"],
          value: coupon.value,
          categoryId: coupon.categoryId ?? "",
          minOrderValueInCents: coupon.minOrderValueInCents,
          maxDiscountInCents: coupon.maxDiscountInCents ?? undefined,
          maxUsesTotal: coupon.maxUsesTotal ?? undefined,
          maxUsesPerUser: coupon.maxUsesPerUser,
          isFirstOrderOnly: coupon.isFirstOrderOnly,
          isActive: coupon.isActive,
          startsAt: coupon.startsAt
            ? new Date(coupon.startsAt).toISOString().slice(0, 16)
            : "",
          expiresAt: coupon.expiresAt
            ? new Date(coupon.expiresAt).toISOString().slice(0, 16)
            : "",
        });
      } else {
        form.reset(defaultValues);
      }
    }
  }, [open, coupon, form]);

  const onSubmit = async (data: FormInput) => {
    let result: { success: boolean; message: string };

    if (isEditing) {
      const updatePayload: UpdateCouponInput = { ...data, couponId: coupon.id };
      result = await updateCoupon(updatePayload);
    } else {
      result = await createCoupon(data);
    }

    if (result.success) {
      toast.success(result.message);
      onOpenChange(false);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar cupom" : "Novo cupom"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="PROMO10"
                        className="uppercase"
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">Percentual (%)</SelectItem>
                        <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                        <SelectItem value="free_shipping">Frete grátis</SelectItem>
                        <SelectItem value="category">Categoria (%)</SelectItem>
                      </SelectContent>
                    </Select>
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
                      {...field}
                      placeholder="Descrição interna do cupom"
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {selectedType !== "free_shipping" && (
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Valor *{" "}
                        {selectedType === "percentage" || selectedType === "category"
                          ? "(%)"
                          : "(R$)"}
                      </FormLabel>
                      <FormControl>
                        <NumericFormat
                          customInput={Input}
                          value={
                            selectedType === "fixed"
                              ? field.value / 100
                              : field.value
                          }
                          onValueChange={(v) =>
                            field.onChange(
                              selectedType === "fixed"
                                ? Math.round((v.floatValue ?? 0) * 100)
                                : (v.floatValue ?? 0),
                            )
                          }
                          decimalScale={selectedType === "fixed" ? 2 : 0}
                          decimalSeparator=","
                          thousandSeparator="."
                          allowNegative={false}
                          placeholder={selectedType === "fixed" ? "0,00" : "0"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(selectedType === "percentage" || selectedType === "category") && (
                <FormField
                  control={form.control}
                  name="maxDiscountInCents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desconto máximo (R$)</FormLabel>
                      <FormControl>
                        <NumericFormat
                          customInput={Input}
                          value={field.value ?? ""}
                          onValueChange={(v) =>
                            field.onChange(
                              v.floatValue ? Math.round(v.floatValue * 100) : undefined,
                            )
                          }
                          decimalScale={2}
                          allowNegative={false}
                          placeholder="Sem limite"
                        />
                      </FormControl>
                      <FormDescription>Opcional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {selectedType === "category" && (
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minOrderValueInCents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pedido mínimo (R$)</FormLabel>
                    <FormControl>
                      <NumericFormat
                        customInput={Input}
                        value={(field.value ?? 0) / 100}
                        onValueChange={(v) =>
                          field.onChange(
                            v.floatValue ? Math.round(v.floatValue * 100) : 0,
                          )
                        }
                        decimalScale={2}
                        allowNegative={false}
                        placeholder="0,00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxUsesTotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usos totais máximos</FormLabel>
                    <FormControl>
                      <NumericFormat
                        customInput={Input}
                        value={field.value ?? ""}
                        onValueChange={(v) =>
                          field.onChange(v.floatValue ?? undefined)
                        }
                        decimalScale={0}
                        allowNegative={false}
                        placeholder="Ilimitado"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxUsesPerUser"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usos por usuário</FormLabel>
                    <FormControl>
                      <NumericFormat
                        customInput={Input}
                        value={field.value}
                        onValueChange={(v) =>
                          field.onChange(v.floatValue ?? 1)
                        }
                        decimalScale={0}
                        allowNegative={false}
                        placeholder="1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Válido a partir de</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="datetime-local"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expira em</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="datetime-local"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-3">
              <FormField
                control={form.control}
                name="isFirstOrderOnly"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">
                      Válido apenas para o primeiro pedido
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">
                      Cupom ativo
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {isEditing ? "Salvar alterações" : "Criar cupom"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
