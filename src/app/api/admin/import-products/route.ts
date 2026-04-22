import { parse } from "papaparse";
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

const MAX_ROWS = 2000;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Normaliza qualquer valor CSV (undefined/null/string) para string antes de validar.
// Resolve "Invalid input" quando células ficam em branco no papaparse.
const optionalString = (maxLength?: number) =>
  z
    .preprocess(
      (val) =>
        val === undefined || val === null ? "" : String(val).trim(),
      maxLength ? z.string().max(maxLength) : z.string(),
    )
    .optional();

// --- Zod schema for each CSV row (v5: one row per variant) ---
const linhaSchema = z.object({
  nome: z.string().min(3, "nome deve ter pelo menos 3 caracteres"),
  categoria_slug: z.string().min(1, "categoria_slug é obrigatório"),
  marca: z.string().min(1, "marca é obrigatório"),
  cor_principal: z.string().min(1, "cor_principal é obrigatório"),
  descricao: z.string().min(1, "descricao é obrigatório"),
  tipo_tamanho: z.enum(["alphabetic", "numeric"] as const),
  fornecedor_verificado: z.enum(["true", "false"] as const),
  preco_em_centavos: z.coerce
    .number()
    .int()
    .positive("preco_em_centavos deve ser positivo"),
  frete_em_centavos: z.coerce
    .number()
    .int()
    .min(0, "frete_em_centavos deve ser >= 0"),
  preco_original_em_centavos: z.coerce.number().int().min(0).default(0),
  cep_origem: z
    .string()
    .regex(/^\d{8}$/, "cep_origem deve ter 8 dígitos numéricos"),
  peso_gramas: z.coerce.number().positive("peso_gramas deve ser positivo"),
  largura_cm: z.coerce.number().positive("largura_cm deve ser positivo"),
  altura_cm: z.coerce.number().positive("altura_cm deve ser positivo"),
  comprimento_cm: z.coerce
    .number()
    .positive("comprimento_cm deve ser positivo"),
  prazo_minimo_dias: z.coerce
    .number()
    .int()
    .positive("prazo_minimo_dias deve ser positivo"),
  prazo_maximo_dias: z.coerce
    .number()
    .int()
    .positive("prazo_maximo_dias deve ser positivo"),
  percentual_desconto: z.coerce.number().int().min(0).max(100).default(0),
  badge_label: optionalString(),
  pix_discount_text: optionalString(),
  esta_em_promocao: z.enum(["true", "false"] as const),
  permite_personalizacao: z.enum(["true", "false"] as const),
  prazo_adicional_personalizacao: z.coerce.number().int().min(0).default(0),
  preco_personalizacao_nome: z.coerce.number().int().min(0).default(0),
  preco_personalizacao_numero: z.coerce.number().int().min(0).default(0),
  // cor_principal existe no CSV mas não tem campo correspondente na tabela product
  video_url: optionalString(),
  foto_1: optionalString(),
  foto_2: optionalString(),
  foto_3: optionalString(),
  foto_4: optionalString(),
  foto_5: optionalString(),
  foto_6: optionalString(),
  foto_7: optionalString(),
  foto_8: optionalString(),
  foto_9: optionalString(),
  foto_10: optionalString(),
  video_url_produto: optionalString(),
  // Per-variant fields (cor e tamanho opcionais — produto pode ser criado sem variante)
  variante_cor: optionalString(),
  variante_tamanho: optionalString(10),
  variante_estoque: z.coerce.number().int().min(0).default(0),
  variante_imagem_url: optionalString(),
});

type CsvRow = z.infer<typeof linhaSchema>;

type ParsedRow = {
  lineNum: number;
  data: CsvRow;
};

export type ImportError = {
  line: number;
  name: string;
  reason: string;
};

export type ImportWarning = {
  line: number;
  name: string;
  reason: string;
};

export type ImportProductsApiResponse = {
  success: true;
  imported: number;
  errors: ImportError[];
  warnings: ImportWarning[];
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

  // CSV structure (v5): line 1 = visual groups (skip), line 2 = headers,
  // line 3 = descriptions (skip), line 4 = warning (skip), line 5+ = data rows
  const lines = csvText.split("\n");
  if (lines.length < 5) {
    return NextResponse.json(
      { error: "CSV inválido ou sem dados." },
      { status: 400 },
    );
  }
  const cleaned = [lines[1], ...lines.slice(4)].join("\n");

  const parsed = parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: true,
    quoteChar: '"',
    newline: "\n",
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
        error: `O CSV contém mais de ${MAX_ROWS} linhas. Divida em arquivos menores.`,
      },
      { status: 400 },
    );
  }

  // --- Pre-fetch data for lookups ---
  const [allCategories, existingProducts] = await Promise.all([
    db
      .select({ id: categoryTable.id, slug: categoryTable.slug })
      .from(categoryTable),
    db
      .select({
        slug: productTable.slug,
        name: productTable.name,
        categoryId: productTable.categoryId,
      })
      .from(productTable),
  ]);

  const categoryBySlug = new Map(allCategories.map((c) => [c.slug, c.id]));
  const existingProductSlugs = new Set(existingProducts.map((p) => p.slug));
  const existingByNameCategory = new Set(
    existingProducts.map((p) => `${p.name}__${p.categoryId}`),
  );

  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];

  // --- Step 1: Validate each row individually ---
  const validRows: ParsedRow[] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    // Original file line: header on line 2, descriptions on line 3, warning on line 4, data from line 5
    const lineNum = i + 5;
    const raw = parsed.data[i];
    const rowName = (raw?.nome ?? `Linha ${lineNum}`).trim();

    const result = linhaSchema.safeParse(raw);
    if (!result.success) {
      const reason = result.error.issues
        .map((e) => {
          const path = e.path.join(".");
          return path ? `${path}: ${e.message}` : e.message;
        })
        .join("; ");
      errors.push({ line: lineNum, name: rowName, reason });
      continue;
    }

    const row = result.data;

    if (row.prazo_maximo_dias < row.prazo_minimo_dias) {
      errors.push({
        line: lineNum,
        name: row.nome,
        reason: "prazo_maximo_dias deve ser >= prazo_minimo_dias",
      });
      continue;
    }

    validRows.push({ lineNum, data: row });
  }

  // --- Step 2: Group valid rows by product name ---
  const groups = new Map<string, ParsedRow[]>();
  for (const row of validRows) {
    const key = row.data.nome;
    const existing = groups.get(key);
    if (existing) {
      existing.push(row);
    } else {
      groups.set(key, [row]);
    }
  }

  // --- Step 3: Import each product group ---
  const batchProductSlugs = new Set<string>();
  const batchNameCategory = new Set<string>();
  let imported = 0;

  for (const [productName, rows] of groups) {
    // Product-level fields come from the first row
    const firstRow = rows[0]!;
    const { data: first, lineNum: firstLine } = firstRow;

    const categoryId = categoryBySlug.get(first.categoria_slug);
    if (!categoryId) {
      for (const { lineNum } of rows) {
        errors.push({
          line: lineNum,
          name: productName,
          reason: `Categoria "${first.categoria_slug}" não encontrada.`,
        });
      }
      continue;
    }

    const nameKey = `${productName}__${categoryId}`;
    if (existingByNameCategory.has(nameKey) || batchNameCategory.has(nameKey)) {
      for (const { lineNum } of rows) {
        errors.push({
          line: lineNum,
          name: productName,
          reason: "Produto já existe nesta categoria (duplicado).",
        });
      }
      continue;
    }

    const productSlug = normalizeSlugSegment(productName);
    if (
      existingProductSlugs.has(productSlug) ||
      batchProductSlugs.has(productSlug)
    ) {
      for (const { lineNum } of rows) {
        errors.push({
          line: lineNum,
          name: productName,
          reason: `Slug "${productSlug}" já está em uso. Altere o nome do produto.`,
        });
      }
      continue;
    }

    // Build variant list — supports comma-separated cores and tamanhos.
    // Combination strategies:
    //   cores[1] × tamanhos[N]  → N variants (same cor)
    //   cores[N] × tamanhos[1]  → N variants (same tamanho)
    //   cores[N] × tamanhos[N]  → N variants (1:1 pairing)
    //   cores[N] × tamanhos[M]  → N×M variants (cartesian product)
    const variantKeys = new Set<string>();
    const variants: Array<{
      cor: string;
      tamanho: string;
      estoque: number;
      imageUrl: string;
    }> = [];

    for (const { data: row, lineNum } of rows) {
      const coresRaw = row.variante_cor?.trim() ?? "";
      const tamanhosRaw = row.variante_tamanho?.trim() ?? "";

      // Row with no cor/tamanho: product will be imported without variants
      if (!coresRaw && !tamanhosRaw) continue;

      const imageUrl = row.variante_imagem_url || first.foto_1 || "";

      const cores = coresRaw.includes(",")
        ? coresRaw.split(",").map((c) => c.trim()).filter(Boolean)
        : coresRaw ? [coresRaw] : [];

      const tamanhosAll = tamanhosRaw.includes(",")
        ? tamanhosRaw.split(",").map((t) => t.trim()).filter(Boolean)
        : tamanhosRaw ? [tamanhosRaw] : [];

      // Validate individual tamanho length; skip invalid ones with a warning
      const tamanhos = tamanhosAll.filter((t) => {
        if (t.length > 10) {
          warnings.push({
            line: lineNum,
            name: productName,
            reason: `Tamanho "${t}" ignorado — máximo 10 caracteres`,
          });
          return false;
        }
        return true;
      });

      if (cores.length === 0 && tamanhos.length === 0) continue;

      // Normalize: at least 1 entry in each list so the cross-product logic works
      const coresFinal = cores.length > 0 ? cores : [""];
      const tamanhosFinal = tamanhos.length > 0 ? tamanhos : [""];

      // Build (cor, tamanho) pairs
      let pairs: Array<[string, string]>;

      if (coresFinal.length === tamanhosFinal.length && coresFinal.length > 1) {
        // Equal counts > 1: pair 1:1
        pairs = coresFinal.map((cor, i) => [cor, tamanhosFinal[i]!]);
      } else if (coresFinal.length === 1) {
        // Single cor, multiple tamanhos
        pairs = tamanhosFinal.map((t) => [coresFinal[0]!, t]);
      } else if (tamanhosFinal.length === 1) {
        // Multiple cores, single tamanho
        pairs = coresFinal.map((c) => [c, tamanhosFinal[0]!]);
      } else {
        // Cartesian product: N cores × M tamanhos
        pairs = coresFinal.flatMap((c) =>
          tamanhosFinal.map((t): [string, string] => [c, t]),
        );
      }

      for (const [cor, tamanho] of pairs) {
        const variantKey = `${cor}__${tamanho}`;
        if (variantKeys.has(variantKey)) {
          errors.push({
            line: lineNum,
            name: productName,
            reason: `Variante duplicada: cor "${cor}" tamanho "${tamanho}" já foi adicionada para este produto.`,
          });
          continue;
        }

        variantKeys.add(variantKey);
        variants.push({ cor, tamanho, estoque: row.variante_estoque, imageUrl });
      }
    }

    try {
      await db.transaction(async (tx) => {
        const [insertedProduct] = await tx
          .insert(productTable)
          .values({
            name: productName,
            slug: productSlug,
            categoryId,
            brand: first.marca,
            description: first.descricao,
            sizeType: first.tipo_tamanho,
            isVerified: first.fornecedor_verificado === "true",
            shippingCostInCents: first.frete_em_centavos,
            originPostalCode: first.cep_origem,
            weightGrams: Math.round(first.peso_gramas),
            widthCm: Math.round(first.largura_cm),
            heightCm: Math.round(first.altura_cm),
            lengthCm: Math.round(first.comprimento_cm),
            deliveryDaysMin: first.prazo_minimo_dias,
            deliveryDaysMax: first.prazo_maximo_dias,
            discountPercent:
              first.percentual_desconto >= 1 && first.percentual_desconto <= 99
                ? first.percentual_desconto
                : null,
            originalPriceInCents:
              first.preco_original_em_centavos > 0
                ? first.preco_original_em_centavos
                : null,
            isOnSale: first.esta_em_promocao === "true",
            isCustomizable: first.permite_personalizacao === "true",
            customizationLeadDays: first.prazo_adicional_personalizacao,
            nameFieldEnabled: first.preco_personalizacao_nome > 0,
            nameFieldPriceInCents: first.preco_personalizacao_nome,
            numberFieldEnabled: first.preco_personalizacao_numero > 0,
            numberFieldPriceInCents: first.preco_personalizacao_numero,
            badgeLabel: first.badge_label || null,
            pixDiscountText: first.pix_discount_text || null,
            videoUrl: first.video_url || null,
          })
          .returning({ id: productTable.id });

        const productId = insertedProduct!.id;

        // Insert product images (from first row)
        const photos = extractPhotos(first);
        if (photos.length > 0) {
          await tx.insert(productImageTable).values(
            photos.map((url, position) => ({ productId, url, position })),
          );
        }

        // Insert variants only when present (product may be created without variants)
        if (variants.length > 0) {
          const usedVariantSlugs = new Set<string>();

          await tx.insert(productVariantTable).values(
            variants.map(({ cor, tamanho, estoque, imageUrl }) => {
              let slug = generateVariantSlug(productSlug, cor, tamanho);
              let attempt = 1;
              while (usedVariantSlugs.has(slug)) {
                slug = `${generateVariantSlug(productSlug, cor, tamanho)}-${attempt}`;
                attempt++;
              }
              usedVariantSlugs.add(slug);

              return {
                productId,
                name: cor,
                slug,
                size: tamanho,
                color: cor,
                priceInCents: first.preco_em_centavos,
                imageUrl,
                stock: estoque,
                isAvailable: estoque > 0,
              };
            }),
          );
        }
      });

      batchProductSlugs.add(productSlug);
      batchNameCategory.add(nameKey);
      imported++;
    } catch (err) {
      const reason =
        err instanceof Error ? err.message : "Erro inesperado ao inserir.";
      errors.push({ line: firstLine, name: productName, reason });
    }
  }

  const response: ImportProductsApiResponse = {
    success: true,
    imported,
    errors,
    warnings,
  };

  return NextResponse.json(response, { status: 200 });
}
