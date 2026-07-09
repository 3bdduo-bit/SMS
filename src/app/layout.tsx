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
      <body className="min-h-screen flex flex-col">
        {/* ThemeProvider يجعل كل المكوّنات تُعيد الرسم عند تغيير الثيم */}
        <ThemeProvider>
          {/* فيديو الخلفية — يعمل على جميع صفحات الموقع */}
          <BackgroundVideo />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
