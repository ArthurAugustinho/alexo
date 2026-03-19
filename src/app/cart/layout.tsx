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

type CartLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function CartLayout({ children }: CartLayoutProps) {
  return children;
}
