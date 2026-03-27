import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cep: string }> },
) {
  const { cep: rawCep } = await params;
  const cep = rawCep.replace(/\D/g, "");

  if (!/^\d{8}$/.test(cep)) {
    return NextResponse.json({ message: "CEP inválido" }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      next: { revalidate: 60 * 60 * 24 },
    });
  } catch {
    return NextResponse.json(
      { message: "Erro ao buscar CEP" },
      { status: 503 },
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { message: "Erro ao buscar CEP" },
      { status: 503 },
    );
  }

  const data = (await response.json()) as {
    erro?: boolean;
    cep?: string;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
  };

  if (data.erro) {
    return NextResponse.json(
      { message: "CEP não encontrado" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    zipCode: data.cep ?? "",
    street: data.logradouro ?? "",
    neighborhood: data.bairro ?? "",
    city: data.localidade ?? "",
    state: data.uf ?? "",
  });
}
