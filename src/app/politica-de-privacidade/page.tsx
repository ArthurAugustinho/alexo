import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — Alexo",
  description: "Saiba como a Alexo coleta e utiliza seus dados pessoais.",
  robots: { index: false },
};

export default function PoliticaDePrivacidadePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="mb-6 text-3xl font-semibold">Política de Privacidade</h1>
      <div className="prose prose-zinc max-w-none">
        <p>
          A Alexo está comprometida com a proteção dos seus dados pessoais. Esta
          política descreve como coletamos, usamos e armazenamos suas
          informações.
        </p>

        <h2>Dados coletados</h2>
        <p>
          Coletamos apenas os dados necessários para processar seus pedidos:
          nome, e-mail, endereço de entrega e informações de pagamento
          processadas com segurança pelo nosso provedor de pagamento.
        </p>

        <h2>Uso dos dados</h2>
        <p>
          Seus dados são utilizados exclusivamente para processar pedidos,
          enviar confirmações e oferecer suporte ao cliente. Nunca
          compartilhamos suas informações com terceiros para fins de marketing.
        </p>

        <h2>Seus direitos</h2>
        <p>
          Conforme a LGPD, você pode solicitar acesso, correção ou exclusão dos
          seus dados a qualquer momento pelo e-mail privacidade@alexo.com.br.
        </p>
      </div>
    </main>
  );
}
