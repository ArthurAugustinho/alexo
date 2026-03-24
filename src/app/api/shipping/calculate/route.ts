import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { productTable } from "@/db/schema";
import {
  DEFAULT_PRODUCT_PACKAGE,
  shippingCalculateRequestSchema,
  shippingOptionsResponseSchema,
} from "@/lib/shipping-schema";

const melhorEnvioServiceSchema = z.object({
  id: z.number().int(),
  name: z.string().trim().min(1),
  price: z.union([z.string(), z.number()]).optional(),
  custom_price: z.union([z.string(), z.number(), z.null()]).optional(),
  delivery_time: z.number().int().nullable().optional(),
  custom_delivery_time: z.number().int().nullable().optional(),
  error: z.union([z.string(), z.null()]).optional(),
  company: z
    .object({
      name: z.string().trim().min(1),
      picture: z.string().trim().min(1).nullable().optional(),
    })
    .nullable()
    .optional(),
});

const melhorEnvioResponseSchema = z.array(melhorEnvioServiceSchema);

function parseMoneyToCents(value: string | number | null | undefined) {
  const numericValue =
    typeof value === "number" ? value : Number.parseFloat(value ?? "0");

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return 0;
  }

  return Math.round(numericValue * 100);
}

function getBaseUrl() {
  const baseUrl = process.env.MELHOR_ENVIO_BASE_URL?.trim();

  if (!baseUrl) {
    return null;
  }

  const normalizedBaseUrl = baseUrl
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  return `https://${normalizedBaseUrl}`;
}

export async function POST(request: Request) {
  const requestBody = await request.json().catch(() => null);
  const payload = shippingCalculateRequestSchema.safeParse(requestBody);

  if (!payload.success) {
    return NextResponse.json(
      {
        message:
          payload.error.issues[0]?.message ?? "Dados invalidos para cotacao.",
      },
      { status: 400 },
    );
  }

  const melhorEnvioToken = process.env.MELHOR_ENVIO_TOKEN?.trim();
  const melhorEnvioBaseUrl = getBaseUrl();

  if (!melhorEnvioToken || !melhorEnvioBaseUrl) {
    return NextResponse.json(
      { message: "Nao foi possivel calcular o frete no momento." },
      { status: 503 },
    );
  }

  const product = await db.query.productTable.findFirst({
    where: eq(productTable.id, payload.data.productId),
  });

  if (!product) {
    return NextResponse.json(
      { message: "Produto nao encontrado para cotacao." },
      { status: 404 },
    );
  }

  const origemPostalCode =
    product.originPostalCode?.trim() ||
    process.env.MELHOR_ENVIO_CEP_ORIGEM?.trim();

  if (!origemPostalCode) {
    return NextResponse.json(
      { message: "Nao foi possivel calcular o frete no momento." },
      { status: 503 },
    );
  }

  console.log("[Shipping] CEP origem usado:", origemPostalCode);
  console.log(
    "[Shipping] Fonte:",
    product.originPostalCode ? "produto" : "env",
  );

  const quantity = payload.data.quantity;
  const packageDimensions = {
    weightGrams:
      (product.weightGrams ?? DEFAULT_PRODUCT_PACKAGE.weightGrams) * quantity,
    widthCm: product.widthCm ?? DEFAULT_PRODUCT_PACKAGE.widthCm,
    heightCm:
      (product.heightCm ?? DEFAULT_PRODUCT_PACKAGE.heightCm) * quantity,
    lengthCm: product.lengthCm ?? DEFAULT_PRODUCT_PACKAGE.lengthCm,
  };

  const melhorEnvioPayload = {
    from: { postal_code: origemPostalCode },
    to: { postal_code: payload.data.postalCode },
    volumes: [
      {
        width: packageDimensions.widthCm,
        height: packageDimensions.heightCm,
        length: packageDimensions.lengthCm,
        weight: Number((packageDimensions.weightGrams / 1000).toFixed(3)),
      },
    ],
    options: { receipt: false, own_hand: false },
    services: "1,2,17",
  };

  const melhorEnvioResponse = await fetch(
    `${melhorEnvioBaseUrl}/api/v2/me/shipment/calculate`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${melhorEnvioToken}`,
        "Content-Type": "application/json",
        "User-Agent": "Alexo (contato@alexo.com.br)",
      },
      body: JSON.stringify(melhorEnvioPayload),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    },
  ).catch((error) => {
    console.error("[Shipping] Nao foi possivel conectar ao Melhor Envio:", error);
    return null;
  });

  if (!melhorEnvioResponse) {
    return NextResponse.json(
      { message: "Nao foi possivel calcular o frete no momento." },
      { status: 503 },
    );
  }

  const responseJson = await melhorEnvioResponse.json().catch(() => null);

  if (!melhorEnvioResponse.ok) {
    const invalidPostalCodeStatus =
      melhorEnvioResponse.status === 400 ||
      melhorEnvioResponse.status === 422;

    return NextResponse.json(
      {
        message: invalidPostalCodeStatus
          ? "CEP invalido ou nao atendido para entrega."
          : "Nao foi possivel calcular o frete no momento.",
      },
      { status: invalidPostalCodeStatus ? 400 : 503 },
    );
  }

  const parsedResponse = melhorEnvioResponseSchema.safeParse(responseJson);

  if (!parsedResponse.success) {
    console.error(
      "[Shipping] Resposta invalida do Melhor Envio:",
      parsedResponse.error.issues,
    );
    return NextResponse.json(
      { message: "Nao foi possivel calcular o frete no momento." },
      { status: 503 },
    );
  }

  const validServices = parsedResponse.data.filter(
    (service) => service.error == null,
  );

  if (validServices.length === 0) {
    return NextResponse.json(
      { message: "CEP invalido ou nao atendido para entrega." },
      { status: 400 },
    );
  }

  const mappedServices = validServices
    .map((service) => {
      const priceInCents = parseMoneyToCents(
        service.custom_price ?? service.price ?? 0,
      );

      return {
        id: service.id,
        name: service.name,
        company: service.company?.name ?? "Transportadora",
        price: priceInCents / 100,
        priceInCents,
        deliveryTime:
          service.custom_delivery_time ?? service.delivery_time ?? 0,
        logoUrl: service.company?.picture ?? "/logo.svg",
      };
    })
    .sort((first, second) => first.priceInCents - second.priceInCents);

  return NextResponse.json(shippingOptionsResponseSchema.parse(mappedServices));
}
