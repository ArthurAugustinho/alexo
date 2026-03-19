import "./globals.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import ReactQueryProvider from "@/providers/react-query";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function getAppUrl() {
  const currentAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!currentAppUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set");
  }

  return currentAppUrl;
}

const appUrl = getAppUrl();

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    template: "%s | BEWEAR",
    default: "BEWEAR - Moda e Vestuario",
  },
  description:
    "BEWEAR e uma loja online de moda e vestuario com pecas selecionadas, novidades sazonais e compra segura.",
  keywords: ["moda", "vestuario", "roupas", "BEWEAR", "loja online"],
  openGraph: {
    type: "website",
    siteName: "BEWEAR",
    title: "BEWEAR - Moda e Vestuario",
    description:
      "BEWEAR e uma loja online de moda e vestuario com pecas selecionadas, novidades sazonais e compra segura.",
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "BEWEAR - Moda e Vestuario",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-default.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ReactQueryProvider>{children}</ReactQueryProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
