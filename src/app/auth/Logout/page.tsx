"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   صفحة تسجيل الخروج  /auth/Logout

   - تقوم بتسجيل خروج المستخدم من النظام.
   - ترسل طلب للسيرفر لإنهاء الجلسة عبر: 
     https://educationplatform2-production.up.railway.app/auth/logout
   - تقوم بمسح بيانات المستخدم (التوكن واليوزر) من الـ localStorage.
   - تحول المستخدم تلقائياً إلى صفحة تسجيل الدخول.
───────────────────────────────────────────────────────────────────────────── */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    /* 
     * ── دالة تنفيذ تسجيل الخروج ──
     * تعمل بمجرد فتح هذه الصفحة (عبر الـ useEffect)
     */
    const performLogout = async () => {
      try {
        // جلب التوكن من التخزين المحلي
        const token = localStorage.getItem("token");
        
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL ||
          "https://educationplatform2-production.up.railway.app";

        // إرسال طلب للسيرفر لتسجيل الخروج إذا كان هناك توكن
        if (token) {
          await fetch(`${API_URL}/auth/logout`, {
            method: "POST", // في الغالب يكون تسجيل الخروج عبر POST
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`, // إرسال التوكن لإنهاء الجلسة من السيرفر
            },
          }).catch((err) => {
            console.error("فشل الاتصال بالسيرفر أثناء تسجيل الخروج:", err);
          });
        }
      } finally {
        // ── مسح البيانات محلياً ──
        // سواء نجح الاتصال بالسيرفر أو فشل (مثلاً بسبب انقطاع الإنترنت)، 
        // يجب أن نقوم بحذف البيانات محلياً لمنع الوصول غير المصرح به
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // تأخير بسيط لتحسين تجربة المستخدم (حتى يرى واجهة الوداع للحظة)
        setTimeout(() => {
          router.push("/auth/login"); // التحويل لصفحة تسجيل الدخول
        }, 800);
      }
    };

    performLogout();
  }, [router]);

  /* ─────────────────────── بدء واجهة المستخدم (JSX) ─────────────────────── */
  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#FFFAF3] px-4">
      {/* عرض واجهة توديعية مع تأثير نبض بسيط أثناء عملية تسجيل الخروج */}
      <div className="flex flex-col items-center animate-[pulse_1.5s_ease-in-out_infinite]">
        
        {/* أيقونة تسجيل الخروج */}
        <div className="w-16 h-16 rounded-full bg-[#FFF2DB] flex items-center justify-center mb-4 shadow-sm border border-[#A8C8E8]">
          <LogOut className="w-8 h-8 text-[#0A2947] ml-1" />
        </div>
        
        {/* نص الوداع */}
        <h1 className="text-xl sm:text-2xl font-bold text-[#0A2947] mb-2 tracking-tight">
          إلى اللقاء!
        </h1>
        <p className="text-sm text-gray-500">
          جارٍ تسجيل الخروج، يرجى الانتظار لحظات...
        </p>
        
      </div>
    </main>
  );
}
