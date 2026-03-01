import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import { Providers } from "@/components/providers";

import "./globals.css";
import { NavMenu } from "@/components/NavMenu";

const manrope = Manrope({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recurring Bill Items",
  description: "Manage categorized finance items with Next.js and Turso",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-theme="dark">
      <body className={manrope.className}>
        <NavMenu />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
