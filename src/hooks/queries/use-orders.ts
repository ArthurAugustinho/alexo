import { useQuery } from "@tanstack/react-query";

import { getOrdersByUser } from "@/lib/queries/orders";

export const getOrdersQueryKey = (userId: string) => ["orders", userId];

export const useOrders = (userId: string | undefined) =>
  useQuery({
    queryKey: getOrdersQueryKey(userId ?? ""),
    queryFn: () => getOrdersByUser(userId!),
    enabled: !!userId,
    staleTime: 1000 * 30,
  });
