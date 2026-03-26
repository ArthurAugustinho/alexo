import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Troca e Devolução — Alexo",
  description: "Conheça a política de troca e devolução da Alexo.",
  robots: { index: false },
};

export default function PoliticaDeTrocaEDevolucaoPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="mb-6 text-3xl font-semibold">Troca e Devolução</h1>
      <div className="prose prose-zinc max-w-none">
        <h2>Prazo para troca ou devolução</h2>
        <p>
          Você tem até <strong>7 dias corridos</strong> após o recebimento do
          produto para solicitar troca ou devolução, conforme o Código de Defesa
          do Consumidor.
        </p>

        <h2>Condições do produto</h2>
        <p>
          O produto deve estar em perfeito estado, sem sinais de uso, com todas
          as etiquetas originais e na embalagem original.
        </p>

        <h2>Como solicitar</h2>
        <p>
          Entre em contato pelo e-mail trocas@alexo.com.br informando o número
          do pedido e o motivo da troca ou devolução. Nossa equipe responderá em
          até 1 dia útil com as instruções de envio.
        </p>

        <h2>Reembolso</h2>
        <p>
          Após recebermos e verificarmos o produto, o reembolso será processado
          em até 5 dias úteis no mesmo método de pagamento utilizado na compra.
        </p>
      </div>
    </main>
  );
}
