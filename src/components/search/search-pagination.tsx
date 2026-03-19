import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  buildSearchUrl,
  type SearchUrlState,
} from "@/helpers/build-search-url";

type SearchPaginationProps = {
  currentFilters: SearchUrlState;
  page: number;
  totalPages: number;
};

export function SearchPagination({
  currentFilters,
  page,
  totalPages,
}: SearchPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3">
      {page <= 1 ? (
        <Button variant="outline" className="rounded-xl" disabled>
          Anterior
        </Button>
      ) : (
        <Button asChild variant="outline" className="rounded-xl">
          <Link
            href={buildSearchUrl(currentFilters, {
              page: Math.max(1, page - 1),
            })}
          >
            Anterior
          </Link>
        </Button>
      )}

      <p className="text-muted-foreground text-sm">
        Pagina {page} de {totalPages}
      </p>

      {page >= totalPages ? (
        <Button variant="outline" className="rounded-xl" disabled>
          Proxima
        </Button>
      ) : (
        <Button asChild variant="outline" className="rounded-xl">
          <Link
            href={buildSearchUrl(currentFilters, {
              page: Math.min(totalPages, page + 1),
            })}
          >
            Proxima
          </Link>
        </Button>
      )}
    </div>
  );
}
