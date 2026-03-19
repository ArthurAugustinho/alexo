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

type AdminLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function AdminLayout({ children }: AdminLayoutProps) {
  return children;
}
