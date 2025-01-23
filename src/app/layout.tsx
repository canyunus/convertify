import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Convertify",
  description: "Modern ve kolay kullanımlı görüntü format dönüştürücü",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
} 