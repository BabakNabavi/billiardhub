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
          @font-face { font-family:'IRANYekanX'; src:url('/fonts/IranYekan/IRANYekanXFaNum-Light.woff2') format('woff2'); font-weight:300; font-style:normal; font-display:swap; }
          @font-face { font-family:'IRANYekanX'; src:url('/fonts/IranYekan/IRANYekanXFaNum-Regular.woff2') format('woff2'); font-weight:400; font-style:normal; font-display:swap; }
          @font-face { font-family:'IRANYekanX'; src:url('/fonts/IranYekan/IRANYekanXFaNum-Medium.woff2') format('woff2'); font-weight:500; font-style:normal; font-display:swap; }
          @font-face { font-family:'IRANYekanX'; src:url('/fonts/IranYekan/IRANYekanXFaNum-DemiBold.woff2') format('woff2'); font-weight:600; font-style:normal; font-display:swap; }
          @font-face { font-family:'IRANYekanX'; src:url('/fonts/IranYekan/IRANYekanXFaNum-Bold.woff2') format('woff2'); font-weight:700; font-style:normal; font-display:swap; }
          @font-face { font-family:'IRANYekanX'; src:url('/fonts/IranYekan/IRANYekanXFaNum-ExtraBold.woff2') format('woff2'); font-weight:800; font-style:normal; font-display:swap; }
          * { font-family: var(--font-base) !important; box-sizing:border-box; }
          input, select, textarea, button { font-family: var(--font-base) !important; }
          body { margin: 0; padding: 0; direction: rtl; }
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