import { Header } from "@/components/common/header";

import { CheckoutSuccessDialog } from "./components/checkout-success-dialog";

export const metadata = {
  robots: { index: false },
};

type CheckoutSuccessPageProps = {
  searchParams: Promise<{
    orderId?: string;
  }>;
};

const CheckoutSuccessPage = async ({
  searchParams,
}: CheckoutSuccessPageProps) => {
  const { orderId } = await searchParams;

  return (
    <>
      <Header />
      <CheckoutSuccessDialog orderId={orderId} />
    </>
  );
};

export default CheckoutSuccessPage;
