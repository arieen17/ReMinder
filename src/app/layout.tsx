/* eslint-disable new-cap */
import type { Metadata } from "next";
import "./globals.css";
import { Outfit, Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReMinder",
  description: "A Memory recall app",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} bg-gray-300`}>{children}</body>
    </html>
  );
}
