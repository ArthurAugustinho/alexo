import { parse } from "papaparse";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import {
  categoryTable,
  productTable,
  productVariantTable,
} from "@/db/schema";
import { normalizeSlugSegment, generateVariantSlug } from "@/helpers/generate-slug";
import { isAdminRole } from "@/lib/admin-auth";
import { auth } from "@/lib/auth";

const MAX_ROWS = 5000;

const csvRowSchema = z.object({
  categoria_slug: z.string().min(1, "categoria_slug é obrigatório"),
  produto_nome: z.string().min(1, "produto_nome é obrigatório"),
  produto_descricao: z.string().min(1, "produto_descricao é obrigatório"),
  produto_marca: z.string().optional(),
  tipo_tamanho: z
    .string()
    .refine((v) => v === "alfabetico" || v === "numerico", {
      message: 'tipo_tamanho deve ser "alfabetico" ou "numerico"',
    }),
  preco: z
    .string()
    .min(1, "preco é obrigatório")
    .transform((val) => {
      const parsed = parseFloat(val.replace(",", "."));
      if (isNaN(parsed) || parsed <= 0) throw new Error("preco inválido");
      return Math.round(parsed * 100);
    }),
  cor: z.string().min(1, "cor é obrigatório"),
  tamanho: z.string().min(1, "tamanho é obrigatório"),
  url_imagem: z.string().url("url_imagem deve ser uma URL válida"),
  estoque: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === "") return 0;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) || parsed < 0 ? 0 : parsed;
    }),
});

type CsvRow = z.infer<typeof csvRowSchema>;

type ProductImportResult = {
  productName: string;
  status: "imported" | "skipped" | "failed";
  variantsCount?: number;
  message?: string;
};

type ImportResponse = {
  imported: number;
  skipped: number;
  failed: number;
  results: ProductImportResult[];
};

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (!isAdminRole(session.user.role as string)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Arquivo CSV não encontrado." }, { status: 400 });
  }

  if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
    return NextResponse.json({ error: "O arquivo deve ser um CSV." }, { status: 400 });
  }

  const text = await file.text();

  const parsed = parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (val) => val.trim(),
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    return NextResponse.json(
      { error: `CSV inválido: ${parsed.errors[0]?.message ?? "erro de parse"}` },
      { status: 400 },
    );
  }

  if (parsed.data.length === 0) {
    return NextResponse.json({ error: "O CSV está vazio." }, { status: 400 });
  }

  if (parsed.data.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `O CSV contém mais de ${MAX_ROWS} linhas. Divida em arquivos menores.` },
      { status: 400 },
    );
  }

  // Validate all rows
  const validRows: Array<{ row: CsvRow; rowIndex: number }> = [];
  const rowErrors: Array<{ rowIndex: number; message: string }> = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const raw = parsed.data[i];
    const result = csvRowSchema.safeParse(raw);
    if (!result.success) {
      const msg = result.error.issues.map((e) => e.message).join("; ");
      rowErrors.push({ rowIndex: i + 2, message: msg }); // +2 for header + 1-based
    } else {
      validRows.push({ row: result.data, rowIndex: i + 2 });
    }
  }

  // Group valid rows by produto_nome
  const productGroups = new Map<
    string,
    { rows: CsvRow[]; rowIndex: number }
  >();
  for (const { row, rowIndex } of validRows) {
    const key = row.produto_nome;
    if (!productGroups.has(key)) {
      productGroups.set(key, { rows: [], rowIndex });
    }
    productGroups.get(key)!.rows.push(row);
  }

  // Prefetch all existing categories
  const allCategories = await db
    .select({ id: categoryTable.id, slug: categoryTable.slug })
    .from(categoryTable);
  const categoryBySlug = new Map(allCategories.map((c) => [c.slug, c.id]));

  // Prefetch existing product slugs to detect conflicts
  const existingProducts = await db
    .select({ slug: productTable.slug })
    .from(productTable);
  const existingSlugs = new Set(existingProducts.map((p) => p.slug));

  const results: ProductImportResult[] = [];
  let importedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  // Add row-level validation failures
  for (const { rowIndex, message } of rowErrors) {
    results.push({
      productName: `Linha ${rowIndex}`,
      status: "failed",
      message,
    });
    failedCount++;
  }

  // Process each product group
  for (const [productName, { rows }] of productGroups) {
    const firstRow = rows[0]!;
    const categoryId = categoryBySlug.get(firstRow.categoria_slug);

    if (!categoryId) {
      results.push({
        productName,
        status: "failed",
        message: `Categoria "${firstRow.categoria_slug}" não encontrada.`,
      });
      failedCount++;
      continue;
    }

    const productSlug = normalizeSlugSegment(productName);

    if (existingSlugs.has(productSlug)) {
      results.push({
        productName,
        status: "skipped",
        message: `Produto com slug "${productSlug}" já existe.`,
      });
      skippedCount++;
      continue;
    }

    try {
      await db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(productTable)
          .values({
            categoryId,
            name: productName,
            slug: productSlug,
            description: firstRow.produto_descricao,
            brand: firstRow.produto_marca || null,
            sizeType:
              firstRow.tipo_tamanho === "numerico" ? "numeric" : "alphabetic",
          })
          .returning({ id: productTable.id });

        const productId = inserted!.id;

        // Deduplicate variants by color+size combination
        const seen = new Set<string>();
        const variantsToInsert = [];
        for (const row of rows) {
          const key = `${row.cor}__${row.tamanho}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const variantSlug = generateVariantSlug(productSlug, row.cor, row.tamanho);
          variantsToInsert.push({
            productId,
            name: `${productName} — ${row.cor} / ${row.tamanho}`,
            slug: variantSlug,
            size: row.tamanho,
            color: row.cor,
            priceInCents: row.preco,
            imageUrl: row.url_imagem,
            stock: row.estoque,
            isAvailable: row.estoque > 0,
          });
        }

        await tx.insert(productVariantTable).values(variantsToInsert);
      });

      existingSlugs.add(productSlug);
      results.push({
        productName,
        status: "imported",
        variantsCount: rows.length,
      });
      importedCount++;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro inesperado ao inserir.";
      results.push({ productName, status: "failed", message });
      failedCount++;
    }
  }

  const response: ImportResponse = {
    imported: importedCount,
    skipped: skippedCount,
    failed: failedCount,
    results,
  };

  return NextResponse.json(response, { status: 200 });
}
