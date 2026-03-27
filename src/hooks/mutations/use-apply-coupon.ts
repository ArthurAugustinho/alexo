import { useMutation, useQueryClient } from "@tanstack/react-query";

import { applyCoupon } from "@/actions/apply-coupon";

import { getUseCartQueryKey } from "../queries/use-cart";

export const getApplyCouponMutationKey = () => ["apply-coupon"];

export const useApplyCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: getApplyCouponMutationKey(),
    mutationFn: (code: string) => applyCoupon({ code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getUseCartQueryKey() });
    },
  });
};
