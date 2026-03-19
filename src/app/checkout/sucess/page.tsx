import { permanentRedirect } from "next/navigation";

const LegacyCheckoutSucessPage = () => {
  // Diagnostico:
  // - /checkout/success contem a implementacao real da pagina pos-pagamento.
  // - A rota legada com typo foi mantida apenas para compatibilidade retroativa.
  // - Em Next.js 15, o redirect HTTP 308 permanente e feito com permanentRedirect().
  permanentRedirect("/checkout/success");
};

export default LegacyCheckoutSucessPage;
