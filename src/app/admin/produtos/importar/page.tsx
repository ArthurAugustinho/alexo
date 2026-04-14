import { UploadCsvForm } from "./components/upload-csv-form";

export default function ImportarProdutosPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Importar produtos via CSV</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Cadastre até 1.000 produtos de uma vez através de uma planilha CSV.
        </p>
      </div>

      <UploadCsvForm />
    </div>
  );
}
