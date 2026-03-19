"use client";

import { SearchIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { buildSearchUrl } from "@/helpers/build-search-url";
import { highlightMatch } from "@/helpers/highlight-match";
import { normalizeSearch } from "@/helpers/normalize-search";
import {
  type ProductSearchResult,
  useProductSearch,
} from "@/hooks/use-product-search";
import { cn } from "@/lib/utils";

import { Button } from "../ui/button";

function SearchBarSkeleton() {
  return (
    <div className="space-y-1 px-2 py-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`search-skeleton-${index}`}
          className="flex items-center gap-3 rounded-2xl px-3 py-2"
        >
          <div className="bg-muted h-8 w-8 animate-pulse rounded-xl" />
          <div className="bg-muted h-4 flex-1 animate-pulse rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SearchBar() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const { results, isLoading, isEmpty } = useProductSearch(query);
  const trimmedQuery = query.trim();
  const normalizedQuery = normalizeSearch(query);
  const shouldShowDropdown =
    isOpen &&
    normalizedQuery.length >= 2 &&
    (isLoading || isEmpty || results.length > 0);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeSearch();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    setHighlightedIndex((currentIndex) => {
      if (results.length === 0 || normalizedQuery.length < 2) {
        return -1;
      }

      if (currentIndex >= results.length) {
        return results.length - 1;
      }

      return currentIndex;
    });
  }, [normalizedQuery.length, results.length]);

  function closeSearch() {
    setIsOpen(false);
    setQuery("");
    setHighlightedIndex(-1);
  }

  function openSearch() {
    setIsOpen(true);
  }

  function navigateToResult(result: ProductSearchResult) {
    closeSearch();
    router.push(`/product/${result.slug}`);
  }

  function navigateToSearchResults() {
    if (!normalizedQuery) {
      return;
    }

    closeSearch();
    router.push(
      buildSearchUrl(
        {},
        {
          q: normalizedQuery,
        },
      ),
    );
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
      return;
    }

    if (event.key === "ArrowDown") {
      if (results.length === 0) {
        return;
      }

      event.preventDefault();
      setHighlightedIndex((currentIndex) =>
        currentIndex < results.length - 1 ? currentIndex + 1 : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      if (results.length === 0) {
        return;
      }

      event.preventDefault();
      setHighlightedIndex((currentIndex) =>
        currentIndex > 0 ? currentIndex - 1 : results.length - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      const selectedResult =
        highlightedIndex >= 0 ? results[highlightedIndex] : null;

      if (selectedResult) {
        navigateToResult(selectedResult);
        return;
      }

      navigateToSearchResults();
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative hidden h-10 w-10 items-center justify-end md:flex"
    >
      <div
        className={cn(
          "absolute top-0 right-0 z-40 overflow-visible transition-[width] duration-200 ease-out",
          isOpen ? "w-[280px]" : "w-10",
        )}
      >
        <div className="bg-background flex h-10 items-center rounded-full border shadow-sm">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Buscar produtos"
            className="rounded-full"
            onClick={openSearch}
          >
            <SearchIcon />
          </Button>

          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            aria-label="Buscar produtos"
            aria-controls="desktop-search-results"
            placeholder="Buscar produtos"
            className={cn(
              "min-w-0 bg-transparent text-sm outline-none transition-all placeholder:text-muted-foreground",
              isOpen
                ? "w-full px-1 opacity-100"
                : "pointer-events-none w-0 px-0 opacity-0",
            )}
          />

          {isOpen ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Fechar busca"
              className="rounded-full"
              onClick={closeSearch}
            >
              <XIcon />
            </Button>
          ) : null}
        </div>

        {shouldShowDropdown ? (
          <div className="bg-background absolute top-[calc(100%+8px)] right-0 w-full overflow-hidden rounded-3xl border shadow-lg">
            {isLoading ? (
              <SearchBarSkeleton />
            ) : isEmpty ? (
              <p className="text-muted-foreground px-4 py-4 text-sm">
                Nenhum produto encontrado para &quot;{trimmedQuery}&quot;
              </p>
            ) : (
              <>
                <ul
                  id="desktop-search-results"
                  role="listbox"
                  className="max-h-80 overflow-y-auto py-2"
                >
                  {results.map((result, index) => {
                    const isSelected = highlightedIndex === index;

                    return (
                      <li key={result.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className={cn(
                            "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                            isSelected ? "bg-muted" : "hover:bg-muted/70",
                          )}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => navigateToResult(result)}
                        >
                          {result.imageUrl ? (
                            <Image
                              src={result.imageUrl}
                              alt={result.name}
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-xl">
                              <SearchIcon className="text-muted-foreground size-4" />
                            </div>
                          )}

                          <span className="line-clamp-1 text-sm">
                            {highlightMatch(result.name, trimmedQuery)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="border-t px-3 py-3">
                  <button
                    type="button"
                    className="text-primary text-sm font-medium"
                    onClick={navigateToSearchResults}
                  >
                    Ver todos os resultados para &quot;{trimmedQuery}&quot;
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
