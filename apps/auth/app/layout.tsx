import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Acongm Auth",
  description: "Platform v2 single sign-on hub for acongm.com",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
