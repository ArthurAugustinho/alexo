"use client";

import { PencilLineIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { toggleSimpleBanner } from "@/actions/toggle-simple-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { SimpleBanner } from "@/lib/queries/simple-banner";

import { DeleteSimpleBannerDialog } from "./delete-simple-banner-dialog";
import { SimpleBannerForm } from "./simple-banner-form";

type SimpleBannerTableProps = {
  initialBanners: SimpleBanner[];
};

export function SimpleBannerTable({ initialBanners }: SimpleBannerTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [banners, setBanners] = useState(initialBanners);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<SimpleBanner | null>(null);

  function openCreate() {
    setEditingBanner(null);
    setIsFormOpen(true);
  }

  function openEdit(banner: SimpleBanner) {
    setEditingBanner(banner);
    setIsFormOpen(true);
  }

  function handleToggle(banner: SimpleBanner, isActive: boolean) {
    setBanners((prev) =>
      prev.map((b) => (b.id === banner.id ? { ...b, isActive } : b)),
    );

    startTransition(async () => {
      const result = await toggleSimpleBanner({ id: banner.id, isActive });

      if (!result.success) {
        toast.error(result.message);
        setBanners(initialBanners);
        return;
      }

      router.refresh();
    });
  }

  function handleSuccess() {
    setIsFormOpen(false);
    router.refresh();
  }

  return (
    <>
      <Card className="border-border/70 bg-background/95 rounded-3xl shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Banner simples</CardTitle>
              <CardDescription>
                Banner de faixa exibido abaixo do banner sazonal. Apenas o mais
                recente ativo é exibido.
              </CardDescription>
            </div>
            <Button
              className="rounded-xl"
              onClick={openCreate}
            >
              <PlusIcon />
              Adicionar
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {banners.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
              Nenhum banner cadastrado ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="flex items-center gap-4 rounded-2xl border p-4"
                >
                  {/* Thumbnail */}
                  <div
                    className="h-12 w-32 shrink-0 overflow-hidden rounded-lg bg-muted/20"
                    style={{
                      backgroundImage: `url(${banner.imageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />

                  {/* Info */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium">
                      {banner.linkUrl || "Sem link"}
                    </p>
                    <Badge
                      className={
                        banner.isActive
                          ? "bg-emerald-100 text-emerald-700 border-transparent"
                          : "bg-slate-200 text-slate-700 border-transparent"
                      }
                    >
                      {banner.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <Switch
                      checked={banner.isActive}
                      onCheckedChange={(checked) =>
                        handleToggle(banner, checked)
                      }
                      disabled={isPending}
                      aria-label="Ativar/desativar banner"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => openEdit(banner)}
                    >
                      <PencilLineIcon className="size-3.5" />
                      Editar
                    </Button>
                    <DeleteSimpleBannerDialog
                      id={banner.id}
                      onSuccess={() => router.refresh()}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <SimpleBannerForm
            banner={editingBanner}
            onSuccess={handleSuccess}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
