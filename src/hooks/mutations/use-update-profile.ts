import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updateProfile } from "@/actions/update-profile";
import type { UpdateProfileInput } from "@/actions/update-profile/schema";

import { getProfileQueryKey } from "../queries/use-profile";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(input),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        void queryClient.invalidateQueries({ queryKey: getProfileQueryKey() });
      } else {
        toast.error(result.message);
      }
    },
    onError: () => {
      toast.error("Erro ao atualizar perfil.");
    },
  });
};
