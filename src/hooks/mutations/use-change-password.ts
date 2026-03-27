import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { changePassword } from "@/actions/change-password";
import type { ChangePasswordInput } from "@/actions/change-password/schema";

export const useChangePassword = () =>
  useMutation({
    mutationFn: (input: ChangePasswordInput) => changePassword(input),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    },
    onError: () => {
      toast.error("Erro ao alterar senha.");
    },
  });
