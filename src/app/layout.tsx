/* ─────────────────────────────────────────────────────────────────────────────
   Root Layout
   - lang="ar"  → المحتوى عربي
   - dir="rtl"  → اتجاه RTL لكامل التطبيق
   - viewport   → يمنع zoom التلقائي في iOS ويحترم شريط المتصفح
───────────────────────────────────────────────────────────────────────────── */
import type { Metadata, Viewport } from "next";
import "./globals.css";

/* عنوان وصف الصفحة */
export const metadata: Metadata = {
  title: "المنصة التعليمية",
  description: "منصة تعليمية للطلاب والمعلمين",
};

/* إعدادات الـ viewport — مهمة للتجاوب مع الموبايل */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,          /* يمنع zoom التلقائي عند focus على الـ input في iOS */
  userScalable: false,
  viewportFit: "cover",     /* يحترم الـ notch والـ home bar */
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /* lang="ar" + dir="rtl" يُطبَّقان على كامل الموقع */
    <html lang="ar" dir="rtl">
      <body className="min-h-screen flex flex-col bg-[#FFFAF3]">
        {children}
      </body>
    </html>
  );
}

