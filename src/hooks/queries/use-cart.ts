import { useQuery } from "@tanstack/react-query";

import { getCart } from "@/actions/get-cart";

export const getUseCartQueryKey = () => ["cart"] as const;

export const useCart = (params?: {
  initialData?: Awaited<ReturnType<typeof getCart>>;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: getUseCartQueryKey(),
    queryFn: () => getCart(),
    initialData: params?.initialData,
    enabled: params?.enabled,
  });
};
