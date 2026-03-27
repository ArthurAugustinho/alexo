"use client";

import { TagIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useApplyCoupon } from "@/hooks/mutations/use-apply-coupon";
import { useRemoveCoupon } from "@/hooks/mutations/use-remove-coupon";

import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface CouponInputProps {
  appliedCouponCode: string | null;
  discountInCents: number;
}

const formatCurrency = (valueInCents: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(valueInCents / 100);

export function CouponInput({
  appliedCouponCode,
  discountInCents,
}: CouponInputProps) {
  const [code, setCode] = useState("");

  const applyMutation = useApplyCoupon();
  const removeMutation = useRemoveCoupon();

  const handleApply = async () => {
    if (!code.trim()) return;

    const result = await applyMutation.mutateAsync(code.trim());

    if (result.valid) {
      toast.success(result.message);
      setCode("");
    } else {
      toast.error(result.message);
    }
  };

  const handleRemove = async () => {
    const result = await removeMutation.mutateAsync();

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  if (appliedCouponCode) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TagIcon className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">
                {appliedCouponCode}
              </p>
              <p className="text-xs text-green-600">
                -{formatCurrency(discountInCents)} de desconto
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-green-700 hover:bg-green-100 hover:text-green-900"
            onClick={handleRemove}
            disabled={removeMutation.isPending}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Código de cupom"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleApply();
        }}
        className="uppercase placeholder:normal-case"
        disabled={applyMutation.isPending}
      />
      <Button
        variant="outline"
        onClick={handleApply}
        disabled={!code.trim() || applyMutation.isPending}
      >
        Aplicar
      </Button>
    </div>
  );
}
