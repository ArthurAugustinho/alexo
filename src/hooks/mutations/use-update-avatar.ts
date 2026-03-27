import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updateAvatar } from "@/actions/update-avatar";

import { getProfileQueryKey } from "../queries/use-profile";

export const useUpdateAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Erro ao fazer upload.");
      }

      const { url } = (await res.json()) as { url: string };
      return updateAvatar({ imageUrl: url });
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        void queryClient.invalidateQueries({ queryKey: getProfileQueryKey() });
      } else {
        toast.error(result.message);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Erro ao atualizar foto.");
    },
  });
};
