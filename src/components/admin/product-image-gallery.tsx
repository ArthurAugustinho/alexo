"use client";

import { ImageIcon, PlusIcon, XIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ImageItem = {
  id?: string;
  url: string;
  alt: string;
  position: number;
  isNew?: boolean;
  file?: File;
  preview?: string;
};

type ProductImageGalleryProps = {
  initialImages?: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  error?: string;
};

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ProductImageGallery({
  initialImages = [],
  onChange,
  error,
}: ProductImageGalleryProps) {
  const [images, setImages] = useState<ImageItem[]>(() =>
    initialImages.map((img, i) => ({ ...img, position: i })),
  );
  const [addMode, setAddMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notify = useCallback(
    (next: ImageItem[]) => {
      const normalized = next.map((img, i) => ({ ...img, position: i }));
      setImages(normalized);
      onChange(normalized);
    },
    [onChange],
  );

  function removeImage(index: number) {
    const next = images.filter((_, i) => i !== index);
    notify(next);
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...images];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    notify(next);
  }

  function moveDown(index: number) {
    if (index === images.length - 1) return;
    const next = [...images];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    notify(next);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("Formato inválido. Use JPG, PNG ou WebP.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    if (images.length >= MAX_IMAGES) {
      setUploadError(`Máximo de ${MAX_IMAGES} imagens por produto.`);
      return;
    }

    const preview = URL.createObjectURL(file);
    const newImage: ImageItem = {
      url: preview,
      alt: "",
      position: images.length,
      isNew: true,
      file,
      preview,
    };

    notify([...images, newImage]);

    // Reset input so same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleAddUrl() {
    setUrlError("");
    const trimmed = urlInput.trim();

    if (!trimmed) {
      setUrlError("Informe a URL da imagem.");
      return;
    }

    if (!trimmed.startsWith("/uploads/") && !trimmed.startsWith("http")) {
      setUrlError("URL inválida. Use https:// ou /uploads/...");
      return;
    }

    if (images.length >= MAX_IMAGES) {
      setUrlError(`Máximo de ${MAX_IMAGES} imagens por produto.`);
      return;
    }

    const newImage: ImageItem = {
      url: trimmed,
      alt: "",
      position: images.length,
    };

    notify([...images, newImage]);
    setUrlInput("");
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Imagens do produto</p>
        <p className="text-muted-foreground text-xs">
          Mínimo 1, máximo {MAX_IMAGES}. A primeira imagem é a principal.
        </p>
      </div>

      {/* Thumbnails grid */}
      {images.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {images.map((img, index) => (
            <div
              key={`${img.id ?? img.preview ?? img.url}-${index}`}
              className="group relative"
            >
              <div
                className={`relative h-24 w-24 overflow-hidden rounded-2xl border-2 bg-muted ${
                  index === 0
                    ? "border-primary"
                    : "border-border/60"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.preview ?? img.url}
                  alt={img.alt || `Imagem ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                {index === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-primary/80 py-0.5 text-center text-[10px] font-semibold text-white">
                    Principal
                  </span>
                )}
              </div>

              {/* Controls */}
              <div className="mt-1 flex items-center justify-center gap-0.5">
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="flex h-6 w-6 items-center justify-center rounded-lg border border-border/60 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Mover para esquerda"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="flex h-6 w-6 items-center justify-center rounded-lg border border-border/60 text-xs text-muted-foreground hover:border-red-400 hover:text-red-600"
                  aria-label="Remover imagem"
                >
                  <XIcon className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={index === images.length - 1}
                  className="flex h-6 w-6 items-center justify-center rounded-lg border border-border/60 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Mover para direita"
                >
                  →
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ImageIcon className="size-4" />
            Nenhuma imagem adicionada
          </div>
        </div>
      )}

      {error && <p className="text-destructive text-xs">{error}</p>}

      {/* Add image section */}
      {images.length < MAX_IMAGES && (
        <div className="space-y-3 rounded-2xl border border-border/50 bg-muted/10 p-4">
          <div className="flex gap-3">
            <label className="flex cursor-pointer items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="add-mode"
                value="upload"
                checked={addMode === "upload"}
                onChange={() => {
                  setAddMode("upload");
                  setUploadError("");
                  setUrlError("");
                }}
                className="accent-primary"
              />
              Upload de arquivo
            </label>
            <label className="flex cursor-pointer items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="add-mode"
                value="url"
                checked={addMode === "url"}
                onChange={() => {
                  setAddMode("url");
                  setUploadError("");
                  setUrlError("");
                }}
                className="accent-primary"
              />
              URL externa
            </label>
          </div>

          {addMode === "upload" ? (
            <div className="space-y-2">
              <Label htmlFor="product-image-file" className="sr-only">
                Selecionar arquivo
              </Label>
              <Input
                id="product-image-file"
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="rounded-xl"
                onChange={handleFileChange}
              />
              {uploadError && (
                <p className="text-destructive text-xs">{uploadError}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  className="rounded-xl"
                  placeholder="https://..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddUrl();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={handleAddUrl}
                >
                  <PlusIcon className="size-4" />
                  Adicionar
                </Button>
              </div>
              {urlError && (
                <p className="text-destructive text-xs">{urlError}</p>
              )}
              {urlInput.startsWith("http") && (
                <div className="h-16 w-16 overflow-hidden rounded-xl border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={urlInput}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
