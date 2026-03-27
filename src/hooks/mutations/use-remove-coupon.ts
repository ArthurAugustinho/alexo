import { useMutation, useQueryClient } from "@tanstack/react-query";

import { removeCoupon } from "@/actions/remove-coupon";

import { getUseCartQueryKey } from "../queries/use-cart";

export const getRemoveCouponMutationKey = () => ["remove-coupon"];

export const useRemoveCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: getRemoveCouponMutationKey(),
    mutationFn: () => removeCoupon(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getUseCartQueryKey() });
    },
  });
};
