import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso — Alexo",
  description: "Leia os termos de uso da plataforma Alexo.",
  robots: { index: false },
};

export default function TermosDeUsoPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="mb-6 text-3xl font-semibold">Termos de Uso</h1>
      <div className="prose prose-zinc max-w-none">
        <p>
          Ao utilizar a plataforma Alexo, você concorda com os termos e
          condições descritos a seguir.
        </p>

        <h2>Uso da plataforma</h2>
        <p>
          A plataforma é destinada ao uso pessoal e não comercial. É proibido
          reproduzir, distribuir ou criar obras derivadas sem autorização prévia
          por escrito.
        </p>

        <h2>Cadastro e conta</h2>
        <p>
          Você é responsável por manter a confidencialidade dos dados de acesso
          à sua conta. Notifique-nos imediatamente em caso de uso não autorizado.
        </p>

        <h2>Pedidos e pagamentos</h2>
        <p>
          Todos os preços são exibidos em Reais (BRL) e incluem os impostos
          aplicáveis. Reservamos o direito de cancelar pedidos em caso de erro
          de preço ou indisponibilidade de estoque.
        </p>

        <h2>Limitação de responsabilidade</h2>
        <p>
          A Alexo não se responsabiliza por danos indiretos decorrentes do uso
          da plataforma. Nossa responsabilidade máxima limita-se ao valor pago
          pelo pedido em questão.
        </p>

        <h2>Alterações nos termos</h2>
        <p>
          Podemos atualizar estes termos a qualquer momento. Alterações
          significativas serão comunicadas por e-mail aos usuários cadastrados.
        </p>
      </div>
    </main>
  );
}
