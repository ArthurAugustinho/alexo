import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export type TrackingEvent = {
  date: string;
  time: string;
  location: string;
  description: string;
  status: string;
};

export type TrackingResult = {
  code: string;
  events: TrackingEvent[];
  isDelivered: boolean;
  lastUpdate: string | null;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { code } = await params;
  const apiKey = process.env.SEU_RASTREIO_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Rastreamento não configurado." },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(
      `https://api.seurastre.io/v1/objects/${encodeURIComponent(code)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "User-Agent": "Alexo (contato@alexo.com.br)",
        },
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Código não encontrado." },
        { status: res.status },
      );
    }

    const data = (await res.json()) as {
      events?: Array<{
        dtHrCriado?: string;
        descricao?: string;
        detalhe?: string;
        unidade?: { cidade?: string; uf?: string; tipo?: string };
      }>;
      isDelivered?: boolean;
    };

    const events: TrackingEvent[] = (data.events ?? []).map((e) => {
      const dtRaw = e.dtHrCriado ?? "";
      const [datePart, timePart] = dtRaw.split("T");
      const location = [e.unidade?.cidade, e.unidade?.uf]
        .filter(Boolean)
        .join(" / ");

      return {
        date: datePart ?? "",
        time: (timePart ?? "").slice(0, 5),
        location,
        description: e.descricao ?? "",
        status: e.detalhe ?? "",
      };
    });

    const result: TrackingResult = {
      code,
      events,
      isDelivered: data.isDelivered ?? false,
      lastUpdate: events[0]?.date ?? null,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Erro ao consultar rastreamento." },
      { status: 500 },
    );
  }
}
