import { useQuery } from "@tanstack/react-query";

import { getAddressesByUser } from "@/lib/queries/addresses";

export const getAddressesQueryKey = (userId: string) => ["addresses", userId];

export const useAddresses = (userId: string | undefined) =>
  useQuery({
    queryKey: getAddressesQueryKey(userId ?? ""),
    queryFn: () => getAddressesByUser(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
