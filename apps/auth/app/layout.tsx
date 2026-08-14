import type { Metadata } from "next";
import "./globals.css";
import { ACONGM_THEME_BOOT_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Acongm Auth",
  description: "Platform v2 single sign-on hub for acongm.com",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.ico", type: "image/x-icon", sizes: "any" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ACONGM_THEME_BOOT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
