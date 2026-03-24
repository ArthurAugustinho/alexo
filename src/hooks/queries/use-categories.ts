import { useQuery } from "@tanstack/react-query";

import { getAllCategories } from "@/lib/queries/categories";

export const getCategoriesQueryKey = () => ["categories"] as const;

export const useCategories = () =>
  useQuery({
    queryKey: getCategoriesQueryKey(),
    queryFn: () => getAllCategories(),
    staleTime: 1000 * 60 * 5,
  });
