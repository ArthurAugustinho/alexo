import { useQuery } from "@tanstack/react-query";

import { getUserProfile } from "@/lib/queries/profile";

export const getProfileQueryKey = () => ["profile"];

export const useProfile = (userId: string | undefined) =>
  useQuery({
    queryKey: getProfileQueryKey(),
    queryFn: () => getUserProfile(userId!),
    enabled: !!userId,
  });
