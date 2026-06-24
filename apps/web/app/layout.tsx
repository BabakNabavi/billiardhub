import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ToastProvider } from '../components/ui/Toast';

export const metadata: Metadata = {
  title: "بیلیارد پلاس",
  description: "اکوسیستم تخصصی بیلیارد ایران",
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
          @font-face {
            font-family: 'Estedad';
            src: url('/fonts/Estedad-Medium.woff2') format('woff2');
            font-weight: 500;
            font-style: normal;
            font-display: swap;
          }
          * { font-family: 'Estedad', 'Vazirmatn', system-ui, sans-serif !important; box-sizing: border-box; }
          input, select, textarea, button { font-family: 'Estedad', 'Vazirmatn', system-ui, sans-serif !important; }
          body { margin: 0; padding: 0; }
          ::-webkit-scrollbar { width: 5px; }
          ::-webkit-scrollbar-track { background: rgba(28,28,26,0.04); }
          ::-webkit-scrollbar-thumb { background: rgba(184,147,58,0.3); border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(184,147,58,0.55); }
        `}</style>
      </head>
      <body style={{ backgroundColor: '#F7F7F5', margin: 0, padding: 0 }}>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <ToastProvider />
      </body>
    </html>
  );
}