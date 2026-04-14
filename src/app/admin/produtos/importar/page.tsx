import { DownloadTemplateButton } from "./components/download-template-button";
import { UploadCsvForm } from "./components/upload-csv-form";

export default function ImportarProdutosPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Importar Produtos em Massa</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Preencha a planilha template, exporte como CSV e faça o upload.
          </p>
        </div>
        <DownloadTemplateButton />
      </div>

      <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">Como usar:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Baixe a planilha template e preencha os dados dos produtos.</li>
          <li>
            Exporte como CSV (File → Download → CSV) mantendo a estrutura
            original com as 3 primeiras linhas de cabeçalho.
          </li>
          <li>Faça o upload do arquivo CSV aqui e clique em "Importar".</li>
          <li>
            Cada linha representa um produto com sua variante base. Variantes
            adicionais podem ser cadastradas na página de variantes do produto.
          </li>
          <li>
            Produtos com nome já existente na mesma categoria serão ignorados
            automaticamente.
          </li>
        </ol>
      </div>

      <UploadCsvForm />
    </div>
  );
}
