import { writeFile } from "fs/promises";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { join } from "path";

import { auth } from "@/lib/auth";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Apenas JPG, PNG e WebP são permitidos." },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Arquivo muito grande. Máximo 10MB." },
      { status: 400 },
    );
  }

  const ext =
    file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const uploadDir = join(process.cwd(), "public", "uploads", "returns");
  const filePath = join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return NextResponse.json({ url: `/uploads/returns/${filename}` });
}
