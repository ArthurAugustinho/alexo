"use client";

import { SlidersHorizontalIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  countActiveSearchFilters,
  type SearchUrlState,
} from "@/helpers/build-search-url";
import { type AvailableFilters } from "@/lib/queries/search";

import { SearchFiltersForm } from "./filter-panel";

type FilterDrawerProps = {
  currentFilters: SearchUrlState;
  availableFilters: AvailableFilters;
};

export function FilterDrawer({
  currentFilters,
  availableFilters,
}: FilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeFilterCount = countActiveSearchFilters(currentFilters);

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="rounded-xl">
            <SlidersHorizontalIcon />
            Filtros
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="w-full max-w-sm overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>

          <div className="px-4 pb-6">
            <SearchFiltersForm
              currentFilters={currentFilters}
              availableFilters={availableFilters}
              onApplied={() => setIsOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
