"use client";

import { FileSpreadsheetIcon, Loader2Icon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useImportProducts } from "@/hooks/mutations/use-import-products";
import type { ImportProductsResponse } from "@/hooks/mutations/use-import-products";

import { DownloadTemplateButton } from "./download-template-button";
import { ImportResultTable } from "./import-result-table";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function UploadCsvForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportProductsResponse | null>(null);

  const { mutate, isPending } = useImportProducts();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("O arquivo deve ser um CSV.");
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

    if (!file.name.endsWith(".csv")) {
      toast.error("O arquivo deve ser um CSV.");
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

    mutate(selectedFile, {
      onSuccess: (data) => {
        setResult(data);
        if (data.imported > 0) {
          toast.success(`${data.imported} produto(s) importado(s) com sucesso.`);
        } else if (data.failed > 0) {
          toast.error("Nenhum produto foi importado. Verifique os erros abaixo.");
        } else {
          toast.info("Nenhum produto novo para importar.");
        }
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Erro ao importar.");
      },
    });
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">Como importar:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Baixe o template CSV e preencha com os dados dos seus produtos.</li>
          <li>Cada linha representa uma variante (cor + tamanho). Linhas com o mesmo <code className="bg-muted rounded px-1">produto_nome</code> formam um único produto.</li>
          <li>O campo <code className="bg-muted rounded px-1">categoria_slug</code> deve corresponder ao slug de uma categoria existente.</li>
          <li>Preços devem estar em reais (ex: <code className="bg-muted rounded px-1">89.90</code>).</li>
          <li>Produtos com slug já cadastrado serão ignorados automaticamente.</li>
        </ol>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Suporte a até 5.000 linhas por arquivo
        </p>
        <DownloadTemplateButton />
      </div>

      {/* Drop zone */}
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center transition-colors hover:border-primary/40 hover:bg-muted/40 cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
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
              <p className="font-medium">Arraste o CSV aqui ou clique para selecionar</p>
              <p className="text-sm text-muted-foreground">
                Formato: .csv — máx. 5MB
              </p>
            </div>
          </>
        )}
      </div>

      {/* Import button */}
      <Button
        className="w-full"
        size="lg"
        disabled={!selectedFile || isPending}
        onClick={handleImport}
      >
        {isPending ? (
          <>
            <Loader2Icon className="size-4 animate-spin" />
            Importando...
          </>
        ) : (
          "Importar produtos"
        )}
      </Button>

      {/* Results */}
      {result && <ImportResultTable result={result} />}
    </div>
  );
}
