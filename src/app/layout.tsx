import "./globals.css";

import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { Geist, Geist_Mono } from "next/font/google";

import { AnnouncementBar } from "@/components/common/announcement-bar";
import { CategoryNav } from "@/components/common/category-nav";
import { Footer } from "@/components/common/footer";
import { Toaster } from "@/components/ui/sonner";
import { getActiveAnnouncementBars } from "@/lib/queries/announcement-bars";
import ReactQueryProvider from "@/providers/react-query";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alexo",
  description: "Moda e vestuário — descubra as últimas tendências na Alexo.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  noStore();
  const bars = await getActiveAnnouncementBars();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AnnouncementBar bars={bars} />
        <ReactQueryProvider>
          <CategoryNav />
          {children}
        </ReactQueryProvider>
        <Footer />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
