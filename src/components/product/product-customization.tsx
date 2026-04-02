"use client";

import { ChevronDownIcon, ChevronUpIcon, HelpCircleIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { type PatchOption } from "@/db/schema";
import { formatCentsToBRL } from "@/helpers/money";

export type CustomizationData = {
  name: string;
  number: string;
  selectedPatchId: string | null;
  totalExtraInCents: number;
};

type ProductCustomizationProps = {
  isCustomizable: boolean;
  leadDays: number;
  nameField: { enabled: boolean; priceInCents: number } | null;
  numberField: { enabled: boolean; priceInCents: number } | null;
  patches: PatchOption[];
  basePriceInCents: number;
  onChange: (data: CustomizationData) => void;
};

export function ProductCustomization({
  isCustomizable,
  leadDays,
  nameField,
  numberField,
  patches,
  basePriceInCents,
  onChange,
}: ProductCustomizationProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [selectedPatchId, setSelectedPatchId] = useState<string | null>(null);

  const totalExtraInCents = useMemo(() => {
    let extra = 0;
    if (nameField?.enabled && name.trim()) extra += nameField.priceInCents;
    if (numberField?.enabled && number.trim()) extra += numberField.priceInCents;
    const patch = patches.find((p) => p.id === selectedPatchId);
    if (patch) extra += patch.priceInCents;
    return extra;
  }, [name, number, selectedPatchId, nameField, numberField, patches]);

  useEffect(() => {
    onChange({ name, number, selectedPatchId, totalExtraInCents });
  }, [name, number, selectedPatchId, totalExtraInCents, onChange]);

  if (!isCustomizable) return null;

  const showNameField = nameField?.enabled;
  const showNumberField = numberField?.enabled;
  const showPatches = patches.length > 0;

  return (
    <div className="rounded-2xl border">
      {/* Header */}
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold"
        onClick={() => setCollapsed((v) => !v)}
      >
        <span className="flex items-center gap-2">
          Personalize
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircleIcon className="text-muted-foreground size-4" />
              </TooltipTrigger>
              <TooltipContent>
                Produtos personalizados têm prazo adicional de {leadDays} dia
                {leadDays !== 1 ? "s" : ""}.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="text-muted-foreground font-normal">
            (+{leadDays} dia{leadDays !== 1 ? "s" : ""})
          </span>
        </span>
        {collapsed ? (
          <ChevronDownIcon className="size-4" />
        ) : (
          <ChevronUpIcon className="size-4" />
        )}
      </button>

      {!collapsed && (
        <div className="space-y-4 border-t px-4 py-4">
          {/* Name + Number fields */}
          {(showNameField || showNumberField) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {showNameField && (
                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    Nome
                    {nameField.priceInCents > 0 && (
                      <span className="text-muted-foreground ml-1">
                        (+{formatCentsToBRL(nameField.priceInCents)})
                      </span>
                    )}
                  </label>
                  <Input
                    placeholder="Seu nome"
                    maxLength={20}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              )}
              {showNumberField && (
                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    Número
                    {numberField.priceInCents > 0 && (
                      <span className="text-muted-foreground ml-1">
                        (+{formatCentsToBRL(numberField.priceInCents)})
                      </span>
                    )}
                  </label>
                  <Input
                    placeholder="00"
                    maxLength={2}
                    value={number}
                    onChange={(e) =>
                      setNumber(e.target.value.replace(/\D/g, "").slice(0, 2))
                    }
                    className="rounded-xl"
                  />
                </div>
              )}
            </div>
          )}

          {/* Patches */}
          {showPatches && (
            <div className="space-y-2">
              <p className="text-xs font-medium">Patches</p>
              <div className="flex flex-wrap gap-2">
                {patches.map((patch) => {
                  const isSelected = selectedPatchId === patch.id;
                  return (
                    <button
                      key={patch.id}
                      type="button"
                      onClick={() =>
                        setSelectedPatchId(isSelected ? null : patch.id)
                      }
                      className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-colors ${
                        isSelected
                          ? "border-primary"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="relative size-12 overflow-hidden rounded-lg">
                        <Image
                          src={patch.imageUrl}
                          alt={patch.label}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <span className="max-w-[80px] text-center text-[10px] leading-tight font-medium">
                        {patch.label}
                      </span>
                      {patch.priceInCents > 0 && (
                        <span className="text-muted-foreground text-[10px]">
                          +{formatCentsToBRL(patch.priceInCents)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Total with customization */}
          {totalExtraInCents > 0 && (
            <p className="text-sm font-medium">
              Total com personalização:{" "}
              <span className="text-primary">
                {formatCentsToBRL(basePriceInCents + totalExtraInCents)}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
