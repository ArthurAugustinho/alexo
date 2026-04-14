import { parse } from "papaparse";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import {
  categoryTable,
  productImageTable,
  productTable,
  productVariantTable,
} from "@/db/schema";
import { normalizeSlugSegment, generateVariantSlug } from "@/helpers/generate-slug";
import { isAdminRole } from "@/lib/admin-auth";
import { auth } from "@/lib/auth";

const MAX_ROWS = 1000;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// --- Zod schema for each CSV row ---
const linhaSchema = z.object({
  nome: z.string().min(3, "nome deve ter pelo menos 3 caracteres"),
  categoria_slug: z.string().min(1, "categoria_slug é obrigatório"),
  marca: z.string().min(1, "marca é obrigatório"),
  descricao: z.string().min(1, "descricao é obrigatório"),
  tipo_tamanho: z.enum(["alphabetic", "numeric"] as const),
  fornecedor_verificado: z.enum(["true", "false"] as const),
  preco_em_centavos: z.coerce.number().int().positive("preco_em_centavos deve ser positivo"),
  frete_em_centavos: z.coerce.number().int().min(0, "frete_em_centavos deve ser >= 0"),
  preco_original_em_centavos: z.coerce.number().int().min(0).default(0),
  cep_origem: z
    .string()
    .regex(/^\d{8}$/, "cep_origem deve ter 8 dígitos numéricos"),
  peso_gramas: z.coerce.number().positive("peso_gramas deve ser positivo"),
  largura_cm: z.coerce.number().positive("largura_cm deve ser positivo"),
  altura_cm: z.coerce.number().positive("altura_cm deve ser positivo"),
  comprimento_cm: z.coerce.number().positive("comprimento_cm deve ser positivo"),
  prazo_minimo_dias: z.coerce.number().int().positive("prazo_minimo_dias deve ser positivo"),
  prazo_maximo_dias: z.coerce.number().int().positive("prazo_maximo_dias deve ser positivo"),
  percentual_desconto: z.coerce.number().int().min(0).max(100),
  badge_label: z.string().optional(),
  pix_discount_text: z.string().optional(),
  esta_em_promocao: z.enum(["true", "false"] as const),
  permite_personalizacao: z.enum(["true", "false"] as const),
  video_url: z.string().url().optional().or(z.literal("")),
  foto_1: z.string().url("foto_1 deve ser uma URL válida"),
  foto_2: z.string().url().optional().or(z.literal("")),
  foto_3: z.string().url().optional().or(z.literal("")),
  foto_4: z.string().url().optional().or(z.literal("")),
  foto_5: z.string().url().optional().or(z.literal("")),
  foto_6: z.string().url().optional().or(z.literal("")),
  foto_7: z.string().url().optional().or(z.literal("")),
  foto_8: z.string().url().optional().or(z.literal("")),
  foto_9: z.string().url().optional().or(z.literal("")),
  foto_10: z.string().url().optional().or(z.literal("")),
  variante_nome: z.string().min(1, "variante_nome é obrigatório"),
  variante_cor: z.string().min(1, "variante_cor é obrigatório"),
  variante_estoque: z.coerce.number().int().min(0),
});

type CsvRow = z.infer<typeof linhaSchema>;

export type ImportError = {
  line: number;
  name: string;
  reason: string;
};

export type ImportProductsApiResponse = {
  success: true;
  imported: number;
  errors: ImportError[];
};

function extractPhotos(row: CsvRow): string[] {
  return [
    row.foto_1,
    row.foto_2,
    row.foto_3,
    row.foto_4,
    row.foto_5,
    row.foto_6,
    row.foto_7,
    row.foto_8,
    row.foto_9,
    row.foto_10,
  ].filter((url): url is string => Boolean(url));
}

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
    return NextResponse.json(
      { error: "Requisição inválida." },
      { status: 400 },
    );
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json(
      { error: "Arquivo CSV não encontrado." },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Arquivo muito grande. Máximo 5MB." },
      { status: 400 },
    );
  }

  const csvText = await file.text();

  // --- CSV structure: line 1 = visual groups (skip), line 2 = headers, line 3 = descriptions (skip), line 4+ = data ---
  const lines = csvText.split("\n");
  if (lines.length < 4) {
    return NextResponse.json(
      { error: "CSV inválido ou sem dados." },
      { status: 400 },
    );
  }
  const cleaned = [lines[1], ...lines.slice(3)].join("\n");

  const parsed = parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (val) => val.trim(),
  });

  if (parsed.data.length === 0) {
    return NextResponse.json(
      { error: "Nenhuma linha de dados encontrada no CSV." },
      { status: 400 },
    );
  }

  if (parsed.data.length > MAX_ROWS) {
    return NextResponse.json(
      {
        error: `O CSV contém mais de ${MAX_ROWS} linhas de dados. Divida em arquivos menores.`,
      },
      { status: 400 },
    );
  }

  // --- Pre-fetch data for lookups ---
  const [allCategories, existingProducts] = await Promise.all([
    db.select({ id: categoryTable.id, slug: categoryTable.slug }).from(categoryTable),
    db.select({ slug: productTable.slug, name: productTable.name, categoryId: productTable.categoryId }).from(productTable),
  ]);

  const categoryBySlug = new Map(allCategories.map((c) => [c.slug, c.id]));
  const existingSlugs = new Set(existingProducts.map((p) => p.slug));
  const existingByNameCategory = new Set(
    existingProducts.map((p) => `${p.name}__${p.categoryId}`),
  );

  // Track slugs inserted in this batch to prevent duplicates within the same file
  const batchSlugs = new Set<string>();
  const batchNameCategory = new Set<string>();

  const errors: ImportError[] = [];
  let imported = 0;

  for (let i = 0; i < parsed.data.length; i++) {
    // Line 1 of cleaned = header, so data rows start at line 2.
    // In original file: line 4+ → display as i+4
    const lineNum = i + 4;
    const raw = parsed.data[i];
    const rowName = (raw?.nome ?? `Linha ${lineNum}`).trim();

    const result = linhaSchema.safeParse(raw);
    if (!result.success) {
      const reason = result.error.issues.map((e) => e.message).join("; ");
      errors.push({ line: lineNum, name: rowName, reason });
      continue;
    }

    const row = result.data;

    // Prazo validation
    if (row.prazo_maximo_dias < row.prazo_minimo_dias) {
      errors.push({
        line: lineNum,
        name: row.nome,
        reason: "prazo_maximo_dias deve ser >= prazo_minimo_dias",
      });
      continue;
    }

    const categoryId = categoryBySlug.get(row.categoria_slug);
    if (!categoryId) {
      errors.push({
        line: lineNum,
        name: row.nome,
        reason: `Categoria "${row.categoria_slug}" não encontrada.`,
      });
      continue;
    }

    const nameKey = `${row.nome}__${categoryId}`;
    if (existingByNameCategory.has(nameKey) || batchNameCategory.has(nameKey)) {
      errors.push({
        line: lineNum,
        name: row.nome,
        reason: "Produto já existe nesta categoria (duplicado).",
      });
      continue;
    }

    const productSlug = normalizeSlugSegment(row.nome);
    if (existingSlugs.has(productSlug) || batchSlugs.has(productSlug)) {
      errors.push({
        line: lineNum,
        name: row.nome,
        reason: `Slug "${productSlug}" já está em uso. Altere o nome do produto.`,
      });
      continue;
    }

    try {
      await db.transaction(async (tx) => {
        const [insertedProduct] = await tx
          .insert(productTable)
          .values({
            name: row.nome,
            slug: productSlug,
            categoryId,
            brand: row.marca,
            description: row.descricao,
            sizeType: row.tipo_tamanho,
            isVerified: row.fornecedor_verificado === "true",
            shippingCostInCents: row.frete_em_centavos,
            originPostalCode: row.cep_origem,
            weightGrams: Math.round(row.peso_gramas),
            widthCm: Math.round(row.largura_cm),
            heightCm: Math.round(row.altura_cm),
            lengthCm: Math.round(row.comprimento_cm),
            deliveryDaysMin: row.prazo_minimo_dias,
            deliveryDaysMax: row.prazo_maximo_dias,
            discountPercent:
              row.percentual_desconto >= 1 && row.percentual_desconto <= 99
                ? row.percentual_desconto
                : null,
            originalPriceInCents:
              row.preco_original_em_centavos > 0
                ? row.preco_original_em_centavos
                : null,
            isOnSale: row.esta_em_promocao === "true",
            isCustomizable: row.permite_personalizacao === "true",
            badgeLabel: row.badge_label || null,
            pixDiscountText: row.pix_discount_text || null,
            videoUrl: row.video_url || null,
          })
          .returning({ id: productTable.id });

        const productId = insertedProduct!.id;

        // Insert product images
        const photos = extractPhotos(row);
        if (photos.length > 0) {
          await tx.insert(productImageTable).values(
            photos.map((url, position) => ({
              productId,
              url,
              position,
            })),
          );
        }

        // Insert base variant
        const variantSlug = generateVariantSlug(
          productSlug,
          row.variante_cor,
          "M",
        );
        await tx.insert(productVariantTable).values({
          productId,
          name: row.variante_nome,
          slug: variantSlug,
          size: "M",
          color: row.variante_cor,
          priceInCents: row.preco_em_centavos,
          imageUrl: row.foto_1,
          stock: row.variante_estoque,
          isAvailable: row.variante_estoque > 0,
        });
      });

      batchSlugs.add(productSlug);
      batchNameCategory.add(nameKey);
      imported++;
    } catch (err) {
      const reason =
        err instanceof Error ? err.message : "Erro inesperado ao inserir.";
      errors.push({ line: lineNum, name: row.nome, reason });
    }
  }

  const response: ImportProductsApiResponse = {
    success: true,
    imported,
    errors,
  };

  return NextResponse.json(response, { status: 200 });
}
