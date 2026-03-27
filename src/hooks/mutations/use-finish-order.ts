import { useMutation, useQueryClient } from "@tanstack/react-query";

import { finishOrder } from "@/lib/actions/checkout";

import { getUseCartQueryKey } from "../queries/use-cart";

export const getUseFinishOrderMutationKey = () => ["finish-order"];

export const useFinishOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: getUseFinishOrderMutationKey(),
    mutationFn: async (shippingCostInCents: number) => {
      const result = await finishOrder({ shippingCostInCents });
      if (!result.success) throw new Error(result.message);
      return { orderId: result.orderId! };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getUseCartQueryKey() });
    },
  });
};