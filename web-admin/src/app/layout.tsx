import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WargaBite Admin — Dashboard Katalog Makanan Komplek",
  description:
    "Panel administrasi WargaBite untuk verifikasi warga, langganan penjual, pesanan COD, dan manajemen komplek.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full bg-[#F8FAFC] text-[#1E293B] flex flex-col">
        {children}
      </body>
    </html>
  );
}
