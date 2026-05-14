import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "بیلیارد پلاس",
  description: "پلتفرم جهانی بیلیارد",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <style>{`
          * { font-family: 'Vazirmatn', system-ui, sans-serif !important; }
          input, select, textarea, button { font-family: 'Vazirmatn', system-ui, sans-serif !important; }
        `}</style>
      </head>
      <body className="bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}