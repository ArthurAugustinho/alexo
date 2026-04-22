"use client";

import { CheckCircle2Icon, CircleAlertIcon, TriangleAlertIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ImportProductsSuccess } from "@/hooks/mutations/use-import-products";

type ImportResultTableProps = {
  result: ImportProductsSuccess;
};

export function ImportResultTable({ result }: ImportResultTableProps) {
  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle2Icon className="size-4" />
              Importados com sucesso
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-3xl font-bold text-emerald-700">
              {result.imported}
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-amber-700">
              <TriangleAlertIcon className="size-4" />
              Avisos
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-3xl font-bold text-amber-700">
              {result.warnings.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-destructive">
              <CircleAlertIcon className="size-4" />
              Com erro
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-3xl font-bold text-destructive">
              {result.errors.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Warning table */}
      {result.warnings.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-amber-700">Avisos (produto importado, mas com ressalvas)</p>
          <div className="rounded-xl border border-amber-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Linha</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Aviso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.warnings.map((warn, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs border-amber-300 text-amber-700">
                        {warn.line}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{warn.name}</TableCell>
                    <TableCell className="text-sm text-amber-700">
                      {warn.reason}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Error table */}
      {result.errors.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Detalhes dos erros</p>
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Linha</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Motivo do erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.errors.map((err, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {err.line}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{err.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {err.reason}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
