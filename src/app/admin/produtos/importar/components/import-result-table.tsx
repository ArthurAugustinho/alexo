"use client";

import { CheckCircle2Icon, CircleAlertIcon, MinusCircleIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  ImportProductsResponse,
  ProductImportResult,
} from "@/hooks/mutations/use-import-products";

type ImportResultTableProps = {
  result: ImportProductsResponse;
};

function StatusBadge({ status }: { status: ProductImportResult["status"] }) {
  if (status === "imported") {
    return (
      <Badge className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
        <CheckCircle2Icon className="size-3.5" />
        Importado
      </Badge>
    );
  }
  if (status === "skipped") {
    return (
      <Badge variant="secondary" className="gap-1">
        <MinusCircleIcon className="size-3.5" />
        Ignorado
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1">
      <CircleAlertIcon className="size-3.5" />
      Falhou
    </Badge>
  );
}

export function ImportResultTable({ result }: ImportResultTableProps) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl border bg-emerald-50 px-4 py-2">
          <CheckCircle2Icon className="size-4 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">
            {result.imported} importados
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border bg-muted/50 px-4 py-2">
          <MinusCircleIcon className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            {result.skipped} ignorados
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border bg-destructive/10 px-4 py-2">
          <CircleAlertIcon className="size-4 text-destructive" />
          <span className="text-sm font-medium text-destructive">
            {result.failed} falhas
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-24 text-center">Variantes</TableHead>
              <TableHead>Mensagem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.results.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{item.productName}</TableCell>
                <TableCell>
                  <StatusBadge status={item.status} />
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {item.variantsCount ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.message ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
