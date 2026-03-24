import { useState } from "react";

export const useUploadBrandLogo = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/brand-logo", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok) {
        const message = data.error ?? "Falha no upload.";
        setError(message);
        return null;
      }

      return data.url ?? null;
    } catch {
      setError("Erro ao fazer upload do arquivo.");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading, error };
};
