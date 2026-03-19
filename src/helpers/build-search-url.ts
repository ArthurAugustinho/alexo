export type SearchUrlState = {
  q?: string;
  categoryId?: string[];
  brand?: string[];
  colors?: string[];
  sizes?: string[];
  priceMin?: number | null;
  priceMax?: number | null;
  page?: number | null;
  perPage?: number | null;
};

type SearchUrlUpdates = {
  [K in keyof SearchUrlState]?: SearchUrlState[K] | null;
};

function appendArrayValues(
  searchParams: URLSearchParams,
  key: "categoryId" | "brand" | "colors" | "sizes",
  values?: string[],
) {
  if (!values?.length) {
    return;
  }

  for (const value of values) {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      continue;
    }

    searchParams.append(key, normalizedValue);
  }
}

export function buildSearchUrl(
  current: SearchUrlState,
  updates: SearchUrlUpdates,
) {
  const nextState: SearchUrlState = {
    q: updates.q === null ? undefined : updates.q ?? current.q,
    categoryId:
      updates.categoryId === null
        ? undefined
        : updates.categoryId ?? current.categoryId,
    brand:
      updates.brand === null
        ? undefined
        : updates.brand ?? current.brand,
    colors:
      updates.colors === null
        ? undefined
        : updates.colors ?? current.colors,
    sizes:
      updates.sizes === null
        ? undefined
        : updates.sizes ?? current.sizes,
    priceMin:
      updates.priceMin === null
        ? null
        : updates.priceMin ?? current.priceMin,
    priceMax:
      updates.priceMax === null
        ? null
        : updates.priceMax ?? current.priceMax,
    page: updates.page === null ? null : updates.page ?? current.page,
    perPage:
      updates.perPage === null ? null : updates.perPage ?? current.perPage,
  };
  const searchParams = new URLSearchParams();

  if (nextState.q?.trim()) {
    searchParams.set("q", nextState.q.trim());
  }

  appendArrayValues(searchParams, "categoryId", nextState.categoryId);
  appendArrayValues(searchParams, "brand", nextState.brand);
  appendArrayValues(searchParams, "colors", nextState.colors);
  appendArrayValues(searchParams, "sizes", nextState.sizes);

  if (typeof nextState.priceMin === "number" && nextState.priceMin >= 0) {
    searchParams.set("priceMin", String(nextState.priceMin));
  }

  if (typeof nextState.priceMax === "number" && nextState.priceMax >= 0) {
    searchParams.set("priceMax", String(nextState.priceMax));
  }

  if (
    typeof nextState.page === "number" &&
    Number.isFinite(nextState.page) &&
    nextState.page > 1
  ) {
    searchParams.set("page", String(nextState.page));
  }

  if (
    typeof nextState.perPage === "number" &&
    Number.isFinite(nextState.perPage) &&
    nextState.perPage > 0 &&
    nextState.perPage !== 24
  ) {
    searchParams.set("perPage", String(nextState.perPage));
  }

  const queryString = searchParams.toString();

  return queryString ? `/search?${queryString}` : "/search";
}

export function countActiveSearchFilters(filters: SearchUrlState) {
  let count = 0;

  count += filters.categoryId?.length ?? 0;
  count += filters.brand?.length ?? 0;
  count += filters.colors?.length ?? 0;
  count += filters.sizes?.length ?? 0;

  if (typeof filters.priceMin === "number") {
    count += 1;
  }

  if (typeof filters.priceMax === "number") {
    count += 1;
  }

  return count;
}
