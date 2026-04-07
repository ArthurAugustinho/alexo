import { Header } from "@/components/common/header";

import { CheckoutPendingDialog } from "./components/checkout-pending-dialog";

export const metadata = {
  robots: { index: false },
};

const CheckoutPendingPage = () => {
  return (
    <>
      <Header />
      <CheckoutPendingDialog />
    </>
  );
};

export default CheckoutPendingPage;
