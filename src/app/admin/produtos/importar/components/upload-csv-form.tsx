"use client";

import { FileSpreadsheetIcon, Loader2Icon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  useImportProducts,
  type ImportProductsSuccess,
} from "@/hooks/mutations/use-import-products";

import { ImportResultTable } from "./import-result-table";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function UploadCsvForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportProductsSuccess | null>(null);

  const { mutate, isPending } = useImportProducts();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("O arquivo deve ter extensão .csv.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setResult(null);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("O arquivo deve ter extensão .csv.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    setSelectedFile(file);
    setResult(null);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function handleImport() {
    if (!selectedFile) return;

    toast.loading("Importando produtos, aguarde...", { id: "import" });

    mutate(selectedFile, {
      onSuccess: (data) => {
        setResult(data);
        toast.dismiss("import");

        if (data.errors.length === 0) {
          toast.success(
            `${data.imported} produto(s) importado(s) com sucesso.`,
          );
        } else if (data.imported > 0) {
          toast.warning(
            `${data.imported} importado(s), ${data.errors.length} com erro. Veja o relatório.`,
          );
        } else {
          toast.error(
            "Nenhum produto foi importado. Verifique os erros no relatório.",
          );
        }
      },
      onError: (err) => {
        toast.dismiss("import");
        toast.error(
          err instanceof Error ? err.message : "Erro ao importar produtos.",
        );
      },
    });
  }

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center transition-colors hover:border-primary/40 hover:bg-muted/40"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />

        {selectedFile ? (
          <>
            <FileSpreadsheetIcon className="size-10 text-primary" />
            <div>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB — clique para trocar
              </p>
            </div>
          </>
        ) : (
          <>
            <UploadIcon className="size-10 text-muted-foreground" />
            <div>
              <p className="font-medium">
                Arraste o CSV aqui ou clique para selecionar
              </p>
              <p className="text-sm text-muted-foreground">
                Formato: .csv — máx. 5MB — até 1.000 produtos
              </p>
            </div>
          </>
        )}
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={!selectedFile || isPending}
        onClick={handleImport}
      >
        {isPending ? (
          <>
            <Loader2Icon className="size-4 animate-spin" />
            Importando produtos...
          </>
        ) : (
          "Importar produtos"
        )}
      </Button>

      {result && <ImportResultTable result={result} />}
    </div>
  );
}
