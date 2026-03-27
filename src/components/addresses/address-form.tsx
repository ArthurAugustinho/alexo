"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";

import { createAddress } from "@/actions/create-address";
import { type CreateAddressInput, createAddressSchema } from "@/actions/create-address/schema";
import { updateAddress } from "@/actions/update-address";
import { type UpdateAddressInput, updateAddressSchema } from "@/actions/update-address/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCepLookup } from "@/hooks/use-cep-lookup";
import type { ShippingAddress } from "@/lib/queries/addresses";

import { getAddressesQueryKey } from "../../hooks/queries/use-addresses";

const UF_OPTIONS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const LABEL_PRESETS = ["Casa", "Trabalho"] as const;

type Props = {
  address?: ShippingAddress;
  userId: string;
  onSuccess: (id: string) => void;
  onCancel: () => void;
};

export function AddressForm({ address, userId, onSuccess, onCancel }: Props) {
  const isEditing = !!address;
  const queryClient = useQueryClient();
  const { lookup, isLoading: cepLoading, error: cepError } = useCepLookup();

  const initialPreset = address
    ? LABEL_PRESETS.includes(address.label as (typeof LABEL_PRESETS)[number])
      ? address.label
      : "Outro"
    : "Casa";

  const [labelPreset, setLabelPreset] = useState<"Casa" | "Trabalho" | "Outro">(
    initialPreset as "Casa" | "Trabalho" | "Outro",
  );

  type FormInput = CreateAddressInput | UpdateAddressInput;

  const schema = isEditing ? updateAddressSchema : createAddressSchema;
  const formResolver = zodResolver(schema) as Resolver<FormInput, unknown, FormInput>;

  const form = useForm<FormInput, unknown, FormInput>({
    resolver: formResolver,
    defaultValues: isEditing
      ? {
          addressId: address.id,
          label: address.label,
          recipientName: address.recipientName,
          phone: address.phone,
          zipCode: address.zipCode,
          street: address.street,
          number: address.number,
          complement: address.complement ?? "",
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          isDefault: address.isDefault,
        }
      : {
          label: "Casa",
          recipientName: "",
          phone: "",
          zipCode: "",
          street: "",
          number: "",
          complement: "",
          neighborhood: "",
          city: "",
          state: "",
          isDefault: false,
        },
  });

  const zipCodeValue = form.watch("zipCode");

  useEffect(() => {
    const cleaned = (zipCodeValue ?? "").replace(/\D/g, "");
    if (cleaned.length === 8) {
      void lookup(cleaned).then((data) => {
        if (data) {
          form.setValue("street", data.street, { shouldValidate: false });
          form.setValue("neighborhood", data.neighborhood, { shouldValidate: false });
          form.setValue("city", data.city, { shouldValidate: false });
          form.setValue("state", data.state, { shouldValidate: false });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zipCodeValue]);

  function handlePresetClick(preset: "Casa" | "Trabalho" | "Outro") {
    setLabelPreset(preset);
    if (preset !== "Outro") {
      form.setValue("label", preset);
    } else {
      form.setValue("label", "");
    }
  }

  async function onSubmit(data: FormInput) {
    let result: { success: boolean; message: string; id?: string };

    if (isEditing) {
      result = await updateAddress(data as UpdateAddressInput);
    } else {
      result = await createAddress(data as CreateAddressInput);
    }

    if (result.success) {
      toast.success(result.message);
      void queryClient.invalidateQueries({
        queryKey: getAddressesQueryKey(userId),
      });
      onSuccess(result.id ?? address?.id ?? "");
    } else {
      toast.error(result.message);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Rótulo */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Rótulo do endereço</p>
          <div className="flex gap-2">
            {(["Casa", "Trabalho", "Outro"] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className={`rounded-xl border px-3 py-1.5 text-sm transition-colors ${
                  labelPreset === preset
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border hover:bg-muted"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          {labelPreset === "Outro" && (
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Nome personalizado (ex: Academia)"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Nome do destinatário */}
        <FormField
          control={form.control}
          name="recipientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do destinatário *</FormLabel>
              <FormControl>
                <Input placeholder="Nome de quem receberá" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Telefone */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone para entrega</FormLabel>
              <FormControl>
                <PatternFormat
                  format="(##) #####-####"
                  placeholder="(11) 99999-9999"
                  customInput={Input}
                  value={field.value ?? ""}
                  onValueChange={({ value }) => field.onChange(value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* CEP */}
        <FormField
          control={form.control}
          name="zipCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CEP *</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <PatternFormat
                    format="#####-###"
                    placeholder="00000-000"
                    customInput={Input}
                    value={field.value ?? ""}
                    onValueChange={({ value }) => field.onChange(value)}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  disabled={cepLoading}
                  onClick={() => {
                    const cleaned = (field.value ?? "").replace(/\D/g, "");
                    if (cleaned.length === 8) void lookup(cleaned);
                  }}
                >
                  {cepLoading ? "Buscando..." : "Buscar"}
                </Button>
              </div>
              {cepError && (
                <p className="text-destructive text-xs">{cepError}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Rua + Número */}
        <div className="grid grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Rua *</FormLabel>
                <FormControl>
                  <Input placeholder="Av. Paulista" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número *</FormLabel>
                <FormControl>
                  <Input placeholder="1000" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Complemento + Bairro */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="complement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Complemento</FormLabel>
                <FormControl>
                  <Input placeholder="Apto 52" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="neighborhood"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bairro *</FormLabel>
                <FormControl>
                  <Input placeholder="Bela Vista" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Cidade + Estado */}
        <div className="grid grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Cidade *</FormLabel>
                <FormControl>
                  <Input placeholder="São Paulo" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado *</FormLabel>
                <FormControl>
                  <select
                    className="border-input bg-background focus:ring-ring h-9 w-full rounded-md border px-3 text-sm focus:ring-2 focus:outline-none"
                    {...field}
                    value={field.value ?? ""}
                  >
                    <option value="">UF</option>
                    {UF_OPTIONS.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Endereço padrão */}
        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value as boolean}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="cursor-pointer font-normal">
                Definir como endereço padrão
              </FormLabel>
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="flex-1"
          >
            {form.formState.isSubmitting
              ? "Salvando..."
              : isEditing
                ? "Salvar alterações"
                : "Salvar endereço"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
