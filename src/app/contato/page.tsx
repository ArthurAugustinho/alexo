import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contato — Alexo",
  description: "Entre em contato com a equipe Alexo.",
  robots: { index: false },
};

export default function ContatoPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="mb-6 text-3xl font-semibold">Contato</h1>
      <div className="prose prose-zinc max-w-none">
        <p>
          Para dúvidas, sugestões ou atendimento ao cliente, entre em contato
          pelos canais abaixo:
        </p>
        <ul>
          <li>
            <strong>E-mail:</strong> contato@alexo.com.br
          </li>
          <li>
            <strong>Horário de atendimento:</strong> Segunda a sexta, das 9h às
            18h
          </li>
        </ul>
        <p>
          Respondemos todas as mensagens em até 1 dia útil.
        </p>
      </div>
    </main>
  );
}
