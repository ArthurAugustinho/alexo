"use client";

import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteCoupon } from "@/actions/delete-coupon";
import { toggleCoupon } from "@/actions/toggle-coupon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { Category } from "@/lib/queries/categories";
import type { CouponWithStats } from "@/lib/queries/coupons";

import { CouponFormDialog } from "./coupon-form-dialog";

interface CouponTableProps {
  coupons: CouponWithStats[];
  categories: Category[];
}

const TYPE_LABELS: Record<string, string> = {
  percentage: "Percentual",
  fixed: "Fixo",
  free_shipping: "Frete grátis",
  category: "Categoria",
};

const formatCurrency = (valueInCents: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(valueInCents / 100);

const formatValue = (type: string, value: number) => {
  if (type === "percentage" || type === "category") return `${value}%`;
  if (type === "fixed") return formatCurrency(value);
  return "—";
};

export function CouponTable({ coupons, categories }: CouponTableProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CouponWithStats | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CouponWithStats | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenCreate = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (coupon: CouponWithStats) => {
    setEditTarget(coupon);
    setFormOpen(true);
  };

  const handleToggle = (coupon: CouponWithStats, checked: boolean) => {
    startTransition(async () => {
      const result = await toggleCoupon({ couponId: coupon.id, isActive: checked });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteCoupon({ couponId: deleteTarget.id });
      if (result.success) {
        toast.success(result.message);
        setDeleteTarget(null);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleOpenCreate}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Novo cupom
        </Button>
      </div>

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Código</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Valor</th>
                <th className="px-4 py-3 text-left font-medium">Usos</th>
                <th className="px-4 py-3 text-left font-medium">Validade</th>
                <th className="px-4 py-3 text-left font-medium">Ativo</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-muted-foreground px-4 py-8 text-center"
                  >
                    Nenhum cupom cadastrado.
                  </td>
                </tr>
              )}
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-mono font-semibold">{coupon.code}</p>
                      {coupon.description && (
                        <p className="text-muted-foreground text-xs">
                          {coupon.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">
                      {TYPE_LABELS[coupon.type] ?? coupon.type}
                    </Badge>
                    {coupon.categoryName && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        {coupon.categoryName}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatValue(coupon.type, coupon.value)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{coupon.totalUsages}</span>
                    {coupon.maxUsesTotal && (
                      <span className="text-muted-foreground">
                        /{coupon.maxUsesTotal}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {coupon.expiresAt ? (
                      <span
                        className={
                          new Date(coupon.expiresAt) < new Date()
                            ? "text-destructive text-xs"
                            : "text-xs"
                        }
                      >
                        até{" "}
                        {new Date(coupon.expiresAt).toLocaleDateString("pt-BR")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Sem prazo</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={coupon.isActive}
                      disabled={isPending}
                      onCheckedChange={(checked) => handleToggle(coupon, checked)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(coupon)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(coupon)}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CouponFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        coupon={editTarget}
        categories={categories}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cupom</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cupom{" "}
              <strong>{deleteTarget?.code}</strong>? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isPending}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
