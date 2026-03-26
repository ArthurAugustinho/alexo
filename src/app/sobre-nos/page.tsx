import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre nós — Alexo",
  description: "Conheça a história e os valores da Alexo.",
  robots: { index: false },
};

export default function SobreNosPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="mb-6 text-3xl font-semibold">Sobre nós</h1>
      <div className="prose prose-zinc max-w-none">
        <p>
          A Alexo é uma loja de moda e vestuário dedicada a oferecer as melhores
          tendências com qualidade e estilo.
        </p>
        <p>
          Fundada com a missão de democratizar o acesso à moda contemporânea,
          trabalhamos com marcas cuidadosamente selecionadas para garantir
          satisfação em cada compra.
        </p>
        <p>
          Nosso compromisso é com a experiência do cliente — desde a navegação
          na loja até a entrega do produto na sua porta.
        </p>
      </div>
    </main>
  );
}
