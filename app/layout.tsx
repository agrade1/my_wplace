import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "my_wplace",
  description: "Seoul-scoped wplace-style pixel drawing map"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
