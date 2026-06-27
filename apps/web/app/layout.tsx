import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ToastProvider } from '../components/ui/Toast';
import ScrollToTop from '../components/ScrollToTop';

export const metadata: Metadata = {
  title: "بیلیارد هاب | پلتفرم جامع و هوشمند بیلیارد",
  description: "اتصال بی‌واسطه بازیکنان، باشگاه‌ها، مربیان، داوران و برترین تولیدکنندگان تجهیزات بیلیارد در ایران و جهان.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
          @font-face { font-family:'Vazir'; src:url('/fonts/Vazir/Vazir-Thin-FD.woff2') format('woff2'),url('/fonts/Vazir/Vazir-Thin-FD.woff') format('woff'); font-weight:100; font-style:normal; font-display:swap; }
          @font-face { font-family:'Vazir'; src:url('/fonts/Vazir/Vazir-Light-FD.woff2') format('woff2'),url('/fonts/Vazir/Vazir-Light-FD.woff') format('woff'); font-weight:300; font-style:normal; font-display:swap; }
          @font-face { font-family:'Vazir'; src:url('/fonts/Vazir/Vazir-Regular-FD.woff2') format('woff2'),url('/fonts/Vazir/Vazir-Regular-FD.woff') format('woff'); font-weight:400; font-style:normal; font-display:swap; }
          @font-face { font-family:'Vazir'; src:url('/fonts/Vazir/Vazir-Medium-FD.woff2') format('woff2'),url('/fonts/Vazir/Vazir-Medium-FD.woff') format('woff'); font-weight:500; font-style:normal; font-display:swap; }
          @font-face { font-family:'Vazir'; src:url('/fonts/Vazir/Vazir-Bold-FD.woff2') format('woff2'),url('/fonts/Vazir/Vazir-Bold-FD.woff') format('woff'); font-weight:700; font-style:normal; font-display:swap; }
          @font-face { font-family:'Vazir'; src:url('/fonts/Vazir/Vazir-Black-FD.woff2') format('woff2'),url('/fonts/Vazir/Vazir-Black-FD.woff') format('woff'); font-weight:900; font-style:normal; font-display:swap; }
          * { font-family:'Vazir', system-ui, sans-serif !important; box-sizing:border-box; }
          input, select, textarea, button { font-family:'Vazir', system-ui, sans-serif !important; }
          body { margin: 0; padding: 0; }
          @media (max-width: 900px) {
            input, textarea, select { font-size: 16px !important; }
          }
          ::-webkit-scrollbar { width: 5px; }
          ::-webkit-scrollbar-track { background: rgba(28,28,26,0.04); }
          ::-webkit-scrollbar-thumb { background: rgba(184,147,58,0.3); border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(184,147,58,0.55); }
        `}</style>
      </head>
      <body style={{ backgroundColor: '#F7F7F5', margin: 0, padding: 0 }}>
        <ScrollToTop />
        <Navbar />
        <main>{children}</main>
        <Footer />
        <ToastProvider />
      </body>
    </html>
  );
}