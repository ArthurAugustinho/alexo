import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

type CheckoutLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function CheckoutLayout({ children }: CheckoutLayoutProps) {
  return children;
}
