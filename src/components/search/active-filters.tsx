import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  buildSearchUrl,
  countActiveSearchFilters,
  type SearchUrlState,
} from "@/helpers/build-search-url";
import { formatCentsToBRL } from "@/helpers/money";
import { type AvailableFilters } from "@/lib/queries/search";

type ActiveFiltersProps = {
  currentFilters: SearchUrlState;
  availableFilters: AvailableFilters;
};

export function ActiveFilters({
  currentFilters,
  availableFilters,
}: ActiveFiltersProps) {
  const activeFilterCount = countActiveSearchFilters(currentFilters);

  if (activeFilterCount === 0) {
    return null;
  }

  const categoryMap = new Map(
    availableFilters.categories.map((category) => [category.id, category.name]),
  );
  const clearFiltersUrl = buildSearchUrl(currentFilters, {
    categoryId: [],
    brand: [],
    colors: [],
    sizes: [],
    priceMin: null,
    priceMax: null,
    page: 1,
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {currentFilters.categoryId?.map((categoryId) => (
        <Button
          key={`category-${categoryId}`}
          asChild
          variant="outline"
          size="sm"
          className="rounded-full"
        >
          <Link
            href={buildSearchUrl(currentFilters, {
              categoryId: currentFilters.categoryId?.filter(
                (currentCategoryId) => currentCategoryId !== categoryId,
              ),
              page: 1,
            })}
          >
            {categoryMap.get(categoryId) ?? categoryId} ×
          </Link>
        </Button>
      ))}

      {currentFilters.brand?.map((brand) => (
        <Button
          key={`brand-${brand}`}
          asChild
          variant="outline"
          size="sm"
          className="rounded-full"
        >
          <Link
            href={buildSearchUrl(currentFilters, {
              brand: currentFilters.brand?.filter(
                (currentBrand) => currentBrand !== brand,
              ),
              page: 1,
            })}
          >
            {brand} ×
          </Link>
        </Button>
      ))}

      {currentFilters.colors?.map((color) => (
        <Button
          key={`color-${color}`}
          asChild
          variant="outline"
          size="sm"
          className="rounded-full"
        >
          <Link
            href={buildSearchUrl(currentFilters, {
              colors: currentFilters.colors?.filter(
                (currentColor) => currentColor !== color,
              ),
              page: 1,
            })}
          >
            {color} ×
          </Link>
        </Button>
      ))}

      {currentFilters.sizes?.map((size) => (
        <Button
          key={`size-${size}`}
          asChild
          variant="outline"
          size="sm"
          className="rounded-full"
        >
          <Link
            href={buildSearchUrl(currentFilters, {
              sizes: currentFilters.sizes?.filter(
                (currentSize) => currentSize !== size,
              ),
              page: 1,
            })}
          >
            {size} ×
          </Link>
        </Button>
      ))}

      {typeof currentFilters.priceMin === "number" ? (
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link
            href={buildSearchUrl(currentFilters, {
              priceMin: null,
              page: 1,
            })}
          >
            De {formatCentsToBRL(currentFilters.priceMin)} ×
          </Link>
        </Button>
      ) : null}

      {typeof currentFilters.priceMax === "number" ? (
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link
            href={buildSearchUrl(currentFilters, {
              priceMax: null,
              page: 1,
            })}
          >
            Ate {formatCentsToBRL(currentFilters.priceMax)} ×
          </Link>
        </Button>
      ) : null}

      <Button asChild variant="ghost" size="sm" className="rounded-full">
        <Link href={clearFiltersUrl}>Limpar filtros</Link>
      </Button>
    </div>
  );
}
