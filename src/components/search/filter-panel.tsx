"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  buildSearchUrl,
  type SearchUrlState,
} from "@/helpers/build-search-url";
import { formatCentsToBRL } from "@/helpers/money";
import { getColorHex } from "@/lib/color-map";
import { type AvailableFilters } from "@/lib/queries/search";
import { cn } from "@/lib/utils";

type SearchFilterPanelProps = {
  currentFilters: SearchUrlState;
  availableFilters: AvailableFilters;
};

type FilterDraftState = {
  categoryId: string[];
  brand: string[];
  colors: string[];
  sizes: string[];
  priceMin: string;
  priceMax: string;
};

function formatPriceInputValue(value?: number | null) {
  if (typeof value !== "number") {
    return "";
  }

  const normalizedValue = value / 100;

  return Number.isInteger(normalizedValue)
    ? String(normalizedValue)
    : normalizedValue.toFixed(2);
}

function parsePriceInputToCents(value: string) {
  const normalizedValue = value.replace(",", ".").trim();

  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return null;
  }

  return Math.round(parsedValue * 100);
}

function createDraftState(filters: SearchUrlState): FilterDraftState {
  return {
    categoryId: [...(filters.categoryId ?? [])],
    brand: [...(filters.brand ?? [])],
    colors: [...(filters.colors ?? [])],
    sizes: [...(filters.sizes ?? [])],
    priceMin: formatPriceInputValue(filters.priceMin),
    priceMax: formatPriceInputValue(filters.priceMax),
  };
}

function toggleArrayValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((currentValue) => currentValue !== value)
    : [...values, value];
}

type SearchFiltersFormProps = SearchFilterPanelProps & {
  onApplied?: () => void;
};

export function SearchFiltersForm({
  currentFilters,
  availableFilters,
  onApplied,
}: SearchFiltersFormProps) {
  const router = useRouter();
  const [draftState, setDraftState] = useState<FilterDraftState>(() =>
    createDraftState(currentFilters),
  );

  useEffect(() => {
    setDraftState(createDraftState(currentFilters));
  }, [currentFilters]);

  const hasAnyAvailableFilter = useMemo(
    () =>
      availableFilters.categories.length > 0 ||
      availableFilters.brands.length > 0 ||
      availableFilters.colors.length > 0 ||
      availableFilters.sizes.length > 0 ||
      availableFilters.priceRange.max > 0,
    [availableFilters],
  );

  function handleApplyFilters() {
    router.push(
      buildSearchUrl(currentFilters, {
        categoryId: draftState.categoryId,
        brand: draftState.brand,
        colors: draftState.colors,
        sizes: draftState.sizes,
        priceMin: parsePriceInputToCents(draftState.priceMin),
        priceMax: parsePriceInputToCents(draftState.priceMax),
        page: 1,
      }),
    );
    onApplied?.();
  }

  function handleClearFilters() {
    const clearedFilters = createDraftState({
      q: currentFilters.q,
      perPage: currentFilters.perPage,
    });

    setDraftState(clearedFilters);
    router.push(
      buildSearchUrl(currentFilters, {
        categoryId: [],
        brand: [],
        colors: [],
        sizes: [],
        priceMin: null,
        priceMax: null,
        page: 1,
      }),
    );
    onApplied?.();
  }

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Filtros</h2>
          <p className="text-muted-foreground text-sm">
            Refine por categoria, marca, cor, tamanho e faixa de preco.
          </p>
        </div>

        {!hasAnyAvailableFilter ? (
          <div className="text-muted-foreground mt-6 rounded-3xl border border-dashed px-4 py-6 text-sm">
            Nenhum filtro disponivel para o resultado atual.
          </div>
        ) : (
          <Accordion
            type="multiple"
            className="mt-4"
            defaultValue={["category", "brand", "colors", "sizes", "price"]}
          >
            <AccordionItem value="category">
              <AccordionTrigger>Categoria</AccordionTrigger>
              <AccordionContent className="space-y-3">
                {availableFilters.categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-border"
                        checked={draftState.categoryId.includes(category.id)}
                        onChange={() =>
                          setDraftState((currentState) => ({
                            ...currentState,
                            categoryId: toggleArrayValue(
                              currentState.categoryId,
                              category.id,
                            ),
                          }))
                        }
                      />
                      {category.name}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {category.count}
                    </span>
                  </label>
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="brand">
              <AccordionTrigger>Marca</AccordionTrigger>
              <AccordionContent className="space-y-3">
                {availableFilters.brands.map((brand) => (
                  <label
                    key={brand.name}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-border"
                        checked={draftState.brand.includes(brand.name)}
                        onChange={() =>
                          setDraftState((currentState) => ({
                            ...currentState,
                            brand: toggleArrayValue(
                              currentState.brand,
                              brand.name,
                            ),
                          }))
                        }
                      />
                      {brand.name}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {brand.count}
                    </span>
                  </label>
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="colors">
              <AccordionTrigger>Cor</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2">
                  {availableFilters.colors.map((color) => {
                    const isSelected = draftState.colors.includes(color.name);

                    return (
                      <Tooltip key={color.name}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors",
                              isSelected
                                ? "border-primary bg-primary/8"
                                : "border-border hover:border-primary/40",
                            )}
                            onClick={() =>
                              setDraftState((currentState) => ({
                                ...currentState,
                                colors: toggleArrayValue(
                                  currentState.colors,
                                  color.name,
                                ),
                              }))
                            }
                          >
                            <span
                              className="size-4 rounded-full border border-black/10"
                              style={{ backgroundColor: getColorHex(color.name) }}
                            />
                            <span>{color.name}</span>
                            <span className="text-muted-foreground text-xs">
                              {color.count}
                            </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{color.name}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sizes">
              <AccordionTrigger>Tamanho</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2">
                  {availableFilters.sizes.map((size) => {
                    const isSelected = draftState.sizes.includes(size.value);

                    return (
                      <button
                        key={size.value}
                        type="button"
                        className={cn(
                          "rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                          isSelected
                            ? "border-primary bg-primary/8"
                            : "border-border hover:border-primary/40",
                        )}
                        onClick={() =>
                          setDraftState((currentState) => ({
                            ...currentState,
                            sizes: toggleArrayValue(
                              currentState.sizes,
                              size.value,
                            ),
                          }))
                        }
                      >
                        {size.value}
                        <span className="text-muted-foreground ml-2 text-xs">
                          {size.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="price">
              <AccordionTrigger>Faixa de preco</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="De R$"
                    value={draftState.priceMin}
                    onChange={(event) =>
                      setDraftState((currentState) => ({
                        ...currentState,
                        priceMin: event.target.value,
                      }))
                    }
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ate R$"
                    value={draftState.priceMax}
                    onChange={(event) =>
                      setDraftState((currentState) => ({
                        ...currentState,
                        priceMax: event.target.value,
                      }))
                    }
                  />
                </div>
                {availableFilters.priceRange.max > 0 ? (
                  <p className="text-muted-foreground text-xs">
                    Intervalo atual:{" "}
                    {formatCentsToBRL(availableFilters.priceRange.min)} ate{" "}
                    {formatCentsToBRL(availableFilters.priceRange.max)}
                  </p>
                ) : null}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <Button className="rounded-xl" onClick={handleApplyFilters}>
            Aplicar filtros
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={handleClearFilters}
          >
            Limpar filtros
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}

export function FilterPanel(props: SearchFilterPanelProps) {
  return (
    <aside className="hidden w-[260px] shrink-0 md:block">
      <div className="sticky top-6 rounded-3xl border border-border/70 bg-background p-5 shadow-sm">
        <SearchFiltersForm {...props} />
      </div>
    </aside>
  );
}
