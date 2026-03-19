"use client";

import { SearchIcon } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

function SearchModalSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`search-modal-skeleton-${index}`}
          className="flex items-center gap-3 rounded-2xl px-3 py-2"
        >
          <div className="bg-muted h-10 w-10 animate-pulse rounded-2xl" />
          <div className="bg-muted h-4 flex-1 animate-pulse rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SearchModal() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const { results, isLoading, isEmpty } = useProductSearch(query);
  const trimmedQuery = query.trim();
  const normalizedQuery = normalizeSearch(query);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setHighlightedIndex(-1);
      return;
    }

    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    setHighlightedIndex((currentIndex) => {
      if (!isOpen || results.length === 0 || normalizedQuery.length < 2) {
        return -1;
      }

      if (currentIndex >= results.length) {
        return results.length - 1;
      }

      return currentIndex;
    });
  }, [isOpen, normalizedQuery.length, results.length]);

  function closeModal() {
    setIsOpen(false);
  }

  function navigateToResult(result: ProductSearchResult) {
    closeModal();
    router.push(`/product/${result.slug}`);
  }

  function navigateToSearchResults() {
    if (!normalizedQuery) {
      return;
    }

    closeModal();
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
      closeModal();
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
    <div className="md:hidden">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Buscar produtos"
          >
            <SearchIcon />
          </Button>
        </DialogTrigger>

        <DialogContent
          showCloseButton={false}
          className="top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Buscar produtos</DialogTitle>
          </DialogHeader>

          <div className="border-b px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="bg-background flex h-11 flex-1 items-center rounded-full border px-3 shadow-sm">
                <SearchIcon className="text-muted-foreground size-4" />
                <input
                  ref={inputRef}
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  aria-label="Buscar produtos"
                  aria-controls="mobile-search-results"
                  placeholder="Buscar produtos"
                  className="w-full bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                className="rounded-full"
                onClick={closeModal}
              >
                Cancelar
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {normalizedQuery.length < 2 ? (
              <p className="text-muted-foreground text-sm">
                Digite pelo menos 2 caracteres para buscar produtos.
              </p>
            ) : isLoading ? (
              <SearchModalSkeleton />
            ) : isEmpty ? (
              <p className="text-muted-foreground text-sm">
                Nenhum produto encontrado para &quot;{trimmedQuery}&quot;
              </p>
            ) : (
              <div className="space-y-3">
                <ul
                  id="mobile-search-results"
                  role="listbox"
                  className="space-y-1"
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
                            "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                            isSelected ? "bg-muted" : "hover:bg-muted/70",
                          )}
                          onMouseEnter={() => setHighlightedIndex(index)}
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

                <button
                  type="button"
                  className="text-primary text-sm font-medium"
                  onClick={navigateToSearchResults}
                >
                  Ver todos os resultados para &quot;{trimmedQuery}&quot;
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
