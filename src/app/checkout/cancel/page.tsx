import { Header } from "@/components/common/header";

import { CheckoutCancelDialog } from "./components/checkout-cancel-dialog";

type CheckoutCancelPageProps = {
  searchParams: Promise<{
    orderId?: string;
  }>;
};

const CheckoutCancelPage = async ({
  searchParams,
}: CheckoutCancelPageProps) => {
  const { orderId } = await searchParams;

  return (
    <>
      <Header />
      <CheckoutCancelDialog orderId={orderId} />
    </>
  );
};

export default CheckoutCancelPage;
