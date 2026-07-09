/* ─────────────────────────────────────────────────────────────────────────────
   Root Layout
   - lang="ar"  → المحتوى عربي
   - dir="rtl"  → اتجاه RTL لكامل التطبيق
   - ThemeProvider → يوفر isDark للكل المكوّنات
───────────────────────────────────────────────────────────────────────────── */
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import BackgroundVideo from "@/components/BackgroundVideo";
import AppLoaderWrapper from "@/components/AppLoaderWrapper";
import SecurityGuard from "@/components/SecurityGuard";

/* عنوان وصف الصفحة */
export const metadata: Metadata = {
  title: "المنصة التعليمية",
  description: "منصة تعليمية للطلاب والمعلمين",
};

/* إعدادات الـ viewport */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /* lang="ar" + dir="rtl" يُطبَّقان على كامل الموقع */
    <html lang="ar" dir="rtl">
      <head>
        {/* ── خطوط Google: Alexandria للنص العام، Cairo للعناوين ── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&family=Alexandria:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col font-body">
        {/* ThemeProvider يجعل كل المكوّنات تُعيد الرسم عند تغيير الثيم */}
        <ThemeProvider>
          {/* حارس الأمان — يمنع الكليك الأيمن وأدوات المطوّر */}
          <SecurityGuard />
          {/* AppLoaderWrapper: يُظهر شاشة التحميل عند أول زيارة في الجلسة */}
          <AppLoaderWrapper>
            {/* فيديو الخلفية — يعمل على جميع صفحات الموقع */}
            <BackgroundVideo />
            {children}
          </AppLoaderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
