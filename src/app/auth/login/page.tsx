"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   صفحة تسجيل الدخول  /auth/login
   - متجاوبة مع جميع الشاشات (موبايل → تابلت → سطح مكتب)
   - Tailwind CSS + lucide-react + Next/Image
   - POST → http://localhost:3000/auth  { action:"login", email, password }
   - الألوان: #0A2947 / #FFE5BF / #FFF2DB / #FFFAF3
───────────────────────────────────────────────────────────────────────────── */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Eye, EyeOff, LogIn, Mail, Lock, AlertCircle, CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  /* ── حالة النموذج ── */
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  /* ── حالة الواجهة ── */
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState("");

  /* ── معالج الإرسال ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("http://localhost:3000/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });

      if (!res.ok) throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      setSuccess("تم تسجيل الدخول بنجاح! جارٍ التحويل…");
      /* TODO: router.push('/dashboard') */
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────────────── JSX ─────────────────────── */
  return (
    /*
     * min-h-[100dvh] → يحترم شريط المتصفح في الموبايل
     * py-8 sm:py-12  → مسافة عمودية متجاوبة
     */
    <main className="min-h-[100dvh] flex items-center justify-center bg-[#FFFAF3] px-4 py-8 sm:py-12">

      {/*
       * البطاقة:
       * - على الموبايل: تملأ العرض كاملاً مع زوايا أصغر وحشو أقل
       * - على sm وما فوق: عرض محدد بـ max-w-md مع زوايا وحشو أكبر
       */}
      <div
        className="
          w-full max-w-sm sm:max-w-md
          bg-white border border-[#FFF2DB] shadow-xl
          rounded-2xl sm:rounded-3xl
          p-6 sm:p-8 md:p-10
          animate-[fadeUp_0.4s_ease-out_forwards]
        "
      >

        {/* ── شعار الصفحة ── */}
        <div className="flex justify-center mb-5 sm:mb-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0A2947] flex items-center justify-center shadow-lg">
            <LogIn className="w-7 h-7 sm:w-8 sm:h-8 text-[#FFE5BF]" />
          </div>
        </div>

        {/* ── العنوان والوصف ── */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A2947] text-center tracking-tight mb-1">
          أهلاً بعودتك
        </h1>
        <p className="text-center text-gray-400 text-xs sm:text-sm mb-6 sm:mb-8">
          سجّل دخولك للمتابعة إلى حسابك
        </p>

        {/* ── رسالة الخطأ ── */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700
                          rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 mb-4 sm:mb-5 text-xs sm:text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── رسالة النجاح ── */}
        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700
                          rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 mb-4 sm:mb-5 text-xs sm:text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* ── النموذج ── */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

          {/* حقل البريد الإلكتروني */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <label htmlFor="login-email" className="text-xs sm:text-sm font-semibold text-[#0A2947]">
              البريد الإلكتروني
            </label>
            <div className="relative">
              {/* أيقونة البريد — يمين (RTL) */}
              <Mail className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                id="login-email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                /* py-2.5 على الموبايل أكبر قليلاً لسهولة اللمس */
                className="w-full pr-9 sm:pr-10 pl-4 py-2.5 sm:py-3 rounded-xl border-2 border-[#FFF2DB]
                           bg-[#FFFAF3] text-[#0A2947] placeholder-gray-300 text-sm
                           outline-none transition-all duration-200
                           focus:border-[#FFE5BF] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,229,191,0.4)]"
              />
            </div>
          </div>

          {/* حقل كلمة المرور */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <label htmlFor="login-password" className="text-xs sm:text-sm font-semibold text-[#0A2947]">
              كلمة المرور
            </label>
            <div className="relative">
              {/* أيقونة القفل — يمين (RTL) */}
              <Lock className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pr-9 sm:pr-10 pl-10 sm:pl-11 py-2.5 sm:py-3 rounded-xl border-2 border-[#FFF2DB]
                           bg-[#FFFAF3] text-[#0A2947] placeholder-gray-300 text-sm
                           outline-none transition-all duration-200
                           focus:border-[#FFE5BF] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,229,191,0.4)]"
              />
              {/* زر إظهار/إخفاء — يسار (RTL) — حجم اللمس 44px+ */}
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2
                           text-gray-400 hover:text-[#0A2947] transition-colors duration-150
                           p-1 rounded-md"
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* زر الإرسال — ارتفاع أكبر على الموبايل لسهولة اللمس */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 sm:py-3.5 rounded-xl bg-[#0A2947] text-[#FFFAF3] font-bold text-sm
                       transition-all duration-200 flex items-center justify-center gap-2 mt-1
                       hover:bg-[#0d365e] hover:-translate-y-0.5 hover:shadow-lg
                       active:translate-y-0 active:shadow-md
                       disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
          >
            {loading ? (
              <>
                {/* spinner بشعار ARC */}
                <div className="relative w-5 h-5">
                  <div className="absolute inset-0 rounded-full border-2 border-[#FFE5BF]/30 border-t-[#FFE5BF] animate-spin" />
                  <div className="absolute inset-0.5 rounded-full overflow-hidden">
                    <Image src="/arc-logo.jpg" alt="" fill className="object-cover" />
                  </div>
                </div>
                جارٍ تسجيل الدخول…
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                تسجيل الدخول
              </>
            )}
          </button>
        </form>

        {/* ── فاصل ── */}
        <div className="flex items-center gap-3 my-5 sm:my-6">
          <div className="flex-1 h-px bg-[#FFF2DB]" />
          <span className="text-xs text-gray-300 font-medium">أو</span>
          <div className="flex-1 h-px bg-[#FFF2DB]" />
        </div>

        {/* ── رابط إنشاء حساب ── */}
        <p className="text-center text-xs sm:text-sm text-gray-400">
          ليس لديك حساب؟{" "}
          <Link
            href="/auth/signup"
            className="text-[#0A2947] font-bold hover:underline transition-colors duration-150"
          >
            أنشئ حساباً
          </Link>
        </p>
      </div>

      {/* ── انيميشن الظهور ── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
