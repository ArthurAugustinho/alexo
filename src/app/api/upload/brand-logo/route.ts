import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import { join } from "path";

import { getCurrentSessionWithRole, isSuperAdminRole } from "@/lib/admin-auth";

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/svg+xml": ".svg",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

const MAX_SIZE = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const { session, role } = await getCurrentSessionWithRole();

  if (!session?.user || !isSuperAdminRole(role)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 });
  }

  const ext = ALLOWED_MIME_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Formato inválido. Use SVG, PNG, JPG ou WebP." },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Arquivo muito grande. Máximo 2MB." },
      { status: 400 },
    );
  }

  const filename = `${crypto.randomUUID()}${ext}`;
  const uploadDir = join(process.cwd(), "public", "uploads", "brands");

  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  await writeFile(join(uploadDir, filename), Buffer.from(bytes));

  return NextResponse.json({ url: `/uploads/brands/${filename}` });
}
