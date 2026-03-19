import Link from "next/link";
import { z } from "zod";

import Footer from "@/components/common/footer";
import { Header } from "@/components/common/header";
import { ActiveFilters } from "@/components/search/active-filters";
import { FilterDrawer } from "@/components/search/filter-drawer";
import { FilterPanel } from "@/components/search/filter-panel";
import { SearchHeader } from "@/components/search/search-header";
import { SearchPagination } from "@/components/search/search-pagination";
import { SearchResultsGrid } from "@/components/search/search-results-grid";
import { Button } from "@/components/ui/button";
import {
  buildSearchUrl,
  type SearchUrlState,
} from "@/helpers/build-search-url";
import { searchProducts } from "@/lib/queries/search";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    categoryId?: string | string[];
    brand?: string | string[];
    colors?: string | string[];
    sizes?: string | string[];
    priceMin?: string;
    priceMax?: string;
    page?: string;
    perPage?: string;
  }>;
};

function toArray(value?: string | string[]) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

const searchPageParamsSchema = z.object({
  q: z.string().optional().default(""),
  categoryId: z.array(z.string().trim().min(1)).default([]),
  brand: z.array(z.string().trim().min(1)).default([]),
  colors: z.array(z.string().trim().min(1)).default([]),
  sizes: z.array(z.string().trim().min(1)).default([]),
  priceMin: z.coerce.number().int().nonnegative().optional(),
  priceMax: z.coerce.number().int().nonnegative().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(24).default(24),
});

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const rawSearchParams = await searchParams;
  const parsedParams = searchPageParamsSchema.safeParse({
    q: rawSearchParams.q,
    categoryId: toArray(rawSearchParams.categoryId),
    brand: toArray(rawSearchParams.brand),
    colors: toArray(rawSearchParams.colors),
    sizes: toArray(rawSearchParams.sizes),
    priceMin: rawSearchParams.priceMin,
    priceMax: rawSearchParams.priceMax,
    page: rawSearchParams.page,
    perPage: rawSearchParams.perPage,
  });
  const currentFilters = (parsedParams.success
    ? {
        q: parsedParams.data.q,
        categoryId: parsedParams.data.categoryId,
        brand: parsedParams.data.brand,
        colors: parsedParams.data.colors,
        sizes: parsedParams.data.sizes,
        priceMin: parsedParams.data.priceMin,
        priceMax: parsedParams.data.priceMax,
        page: parsedParams.data.page,
        perPage: parsedParams.data.perPage,
      }
    : {
        q: "",
        categoryId: [],
        brand: [],
        colors: [],
        sizes: [],
        page: 1,
        perPage: 24,
      }) satisfies SearchUrlState;
  const searchResult = await searchProducts({
    q: currentFilters.q,
    categoryId: currentFilters.categoryId,
    brand: currentFilters.brand,
    colors: currentFilters.colors,
    sizes: currentFilters.sizes,
    priceMin: currentFilters.priceMin ?? undefined,
    priceMax: currentFilters.priceMax ?? undefined,
    page: currentFilters.page ?? 1,
    perPage: currentFilters.perPage ?? 24,
  });
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
    <>
      <Header />
      <main className="space-y-6 px-5 py-6">
        <SearchHeader query={currentFilters.q} total={searchResult.total} />

        <div className="flex flex-col gap-6 md:flex-row">
          <FilterPanel
            currentFilters={currentFilters}
            availableFilters={searchResult.filters}
          />

          <div className="min-w-0 flex-1 space-y-4">
            <FilterDrawer
              currentFilters={currentFilters}
              availableFilters={searchResult.filters}
            />

            <ActiveFilters
              currentFilters={currentFilters}
              availableFilters={searchResult.filters}
            />

            {searchResult.products.length === 0 ? (
              <div className="rounded-3xl border border-dashed px-6 py-12 text-center">
                <p className="text-lg font-semibold">
                  {currentFilters.q?.trim()
                    ? `Nenhum produto encontrado para "${currentFilters.q}"`
                    : "Nenhum produto encontrado"}
                </p>
                <p className="text-muted-foreground mt-2 text-sm">
                  Tente ajustar ou limpar os filtros para ampliar os resultados.
                </p>
                <div className="mt-5">
                  <Button asChild className="rounded-xl">
                    <Link href={clearFiltersUrl}>Limpar filtros</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <SearchResultsGrid products={searchResult.products} />
                <SearchPagination
                  currentFilters={currentFilters}
                  page={searchResult.page}
                  totalPages={searchResult.totalPages}
                />
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
