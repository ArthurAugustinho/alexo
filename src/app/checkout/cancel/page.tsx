import { Header } from "@/components/common/header";
import { getLogisticsConfig } from "@/lib/queries/logistics";

import { CheckoutCancelDialog } from "./components/checkout-cancel-dialog";

type CheckoutCancelPageProps = {
  searchParams: Promise<{
    orderId?: string;
  }>;
};

const CheckoutCancelPage = async ({
  searchParams,
}: CheckoutCancelPageProps) => {
  const [{ orderId }, logisticsConfig] = await Promise.all([
    searchParams,
    getLogisticsConfig(),
  ]);

  return (
    <>
      <Header />
      <CheckoutCancelDialog
        orderId={orderId}
        imageUrl={logisticsConfig?.cancelImageUrl}
      />
    </>
  );
};

export default CheckoutCancelPage;
