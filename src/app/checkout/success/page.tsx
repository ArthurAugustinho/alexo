import { Header } from "@/components/common/header";
import { getLogisticsConfig } from "@/lib/queries/logistics";

import { CheckoutSuccessDialog } from "./components/checkout-success-dialog";

type CheckoutSuccessPageProps = {
  searchParams: Promise<{
    orderId?: string;
  }>;
};

const CheckoutSuccessPage = async ({
  searchParams,
}: CheckoutSuccessPageProps) => {
  const [{ orderId }, logisticsConfig] = await Promise.all([
    searchParams,
    getLogisticsConfig(),
  ]);

  return (
    <>
      <Header />
      <CheckoutSuccessDialog
        orderId={orderId}
        imageUrl={logisticsConfig?.successImageUrl}
      />
    </>
  );
};

export default CheckoutSuccessPage;
