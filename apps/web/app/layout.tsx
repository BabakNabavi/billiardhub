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
      <body style={{ backgroundColor: '#030a06', margin: 0, padding: 0 }}>
        <Navbar />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}