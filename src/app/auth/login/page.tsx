"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   صفحة تسجيل الدخول  /auth/login

   - متجاوبة مع جميع الشاشات (موبايل → تابلت → سطح مكتب)
   - تعتمد على إطار العمل Tailwind CSS ومكتبة الأيقونات lucide-react
   - دعم الوضع الليلي عبر ThemeProvider
───────────────────────────────────────────────────────────────────────────── */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, LogIn, Lock, AlertCircle, CheckCircle2, AtSign
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { getColors } from "@/lib/theme/colors";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);
  const tr = "transition-all duration-300 ease-in-out";

  /* 
   * ── حالة النموذج (Form State) ──
   */
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");

  /* 
   * ── حالة الواجهة (UI State) ──
   */
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState("");

  const [errors, setErrors]             = useState<{ userName?: string; password?: string; general?: string }>({});

  const handleBlur = (field: string, value: string) => {
    let error: string | undefined = undefined;
    if (field === "userName") {
      if (!value) error = "اسم المستخدم مطلوب";
      else if (value.length < 3) error = "اسم المستخدم يجب أن يكون 3 أحرف على الأقل";
    } else if (field === "password") {
      if (!value) error = "كلمة المرور مطلوبة";
    }
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setErrors({});

    const validationErrors: { userName?: string; password?: string; general?: string } = {};
    if (!userName) validationErrors.userName = "اسم المستخدم مطلوب";
    else if (userName.length < 3) validationErrors.userName = "اسم المستخدم يجب أن يكون 3 أحرف على الأقل";

    if (!password) validationErrors.password = "كلمة المرور مطلوبة";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://educationplatform2-production.up.railway.app";

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const detail =
          data?.errorDetails?.[0]?.message ||
          data?.message ||
          "اسم المستخدم أو كلمة المرور غير صحيحة.";
        throw new Error(detail);
      }

      const token = data?.data?.token || data?.token || data?.accessToken;
      if (token) {
        localStorage.setItem("token", token);
      }
      
      const userObj = data?.data?.user || data?.user || data?.data;
      if (userObj) {
        localStorage.setItem("user", JSON.stringify(userObj));
      }

      let role = "";
      try {
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          role = payload?.role?.toLowerCase() || "";
        }
      } catch (e) {
        console.error("Failed to parse token", e);
      }

      if (role === "teacher" || role === "admin" || role === "instructor") {
        setTimeout(() => router.push("/teacher"), 600);
      } else {
        setTimeout(() => router.push("/student"), 600);
      }
    } catch (err: unknown) {
      setErrors({ general: err instanceof Error ? err.message : "حدث خطأ غير متوقع." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`min-h-[100dvh] flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden ${tr}`} style={{ backgroundColor: C.page }} dir="rtl">
      
      {/* زر الثيم في الأعلى */}
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-50">
        <ThemeToggle />
      </div>

      <div
        className={`w-full max-w-sm sm:max-w-md shadow-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 animate-[fadeUp_0.4s_ease-out_forwards] ${tr}`}
        style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
      >
        {/* ── شعار الصفحة ── */}
        <div className="flex justify-center mb-5 sm:mb-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0A2947] flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105">
            <LogIn className="w-7 h-7 sm:w-8 sm:h-8 text-[#A8C8E8]" />
          </div>
        </div>

        {/* ── العنوان والوصف ── */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-center tracking-tight mb-1" style={{ color: C.textP }}>
          أهلاً بعودتك
        </h1>
        <p className="text-center text-xs sm:text-sm mb-6 sm:mb-8" style={{ color: C.textM }}>
          سجّل دخولك للمتابعة إلى حسابك
        </p>

        {/* ── رسالة الخطأ العامة ── */}
        {errors.general && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 mb-4 sm:mb-5 text-xs sm:text-sm font-medium animate-[fadeUp_0.25s_ease-out_forwards]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* ── رسالة النجاح ── */}
        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 mb-4 sm:mb-5 text-xs sm:text-sm font-medium animate-[fadeUp_0.25s_ease-out_forwards]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* ── نموذج الإدخال ── */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

          {/* ── حقل اسم المستخدم ── */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <label htmlFor="login-username" className="text-xs sm:text-sm font-semibold" style={{ color: C.textP }}>
              اسم المستخدم
            </label>
            <div className="relative group">
              <AtSign className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200" style={{ color: C.textM }} />
              <input
                id="login-username"
                type="text"
                placeholder="user_123"
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  if (errors.userName) setErrors(prev => ({ ...prev, userName: undefined }));
                }}
                onBlur={(e) => handleBlur("userName", e.target.value)}
                className={`w-full pr-9 sm:pr-10 pl-4 py-2.5 sm:py-3 rounded-xl border-2 text-sm outline-none transition-all duration-300 focus:shadow-[0_0_0_4px_rgba(168,200,232,0.35)] ${errors.userName ? 'border-red-400 focus:border-red-500' : ''}`}
                style={{ backgroundColor: C.input, color: C.textP, borderColor: errors.userName ? undefined : C.border }}
                dir="ltr"
              />
            </div>
            {errors.userName && (
              <span className="text-red-500 text-xs font-medium animate-[fadeUp_0.2s_ease-out_forwards] flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.userName}
              </span>
            )}
          </div>

          {/* ── حقل كلمة المرور ── */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <label htmlFor="login-password" className="text-xs sm:text-sm font-semibold" style={{ color: C.textP }}>
              كلمة المرور
            </label>
            <div className="relative group">
              <Lock className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200" style={{ color: C.textM }} />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                }}
                onBlur={(e) => handleBlur("password", e.target.value)}
                className={`w-full pr-9 sm:pr-10 pl-10 sm:pl-11 py-2.5 sm:py-3 rounded-xl border-2 text-sm outline-none transition-all duration-300 focus:shadow-[0_0_0_4px_rgba(168,200,232,0.35)] ${errors.password ? 'border-red-400 focus:border-red-500' : ''}`}
                style={{ backgroundColor: C.input, color: C.textP, borderColor: errors.password ? undefined : C.border }}
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 transition-all duration-200 p-1 rounded-md hover:bg-[#A8C8E8]/20 active:scale-90"
                style={{ color: C.textM }}
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <span className="text-red-500 text-xs font-medium animate-[fadeUp_0.2s_ease-out_forwards] flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.password}
              </span>
            )}
          </div>

          {/* ── زر الإرسال ── */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 sm:py-3.5 rounded-xl bg-[#0A2947] text-[#FFFAF3] font-bold text-sm tracking-wide flex items-center justify-center gap-2 mt-1 transition-all duration-300 ease-in-out hover:bg-[#0d365e] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(10,41,71,0.3)] active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <div className="relative w-5 h-5">
                  <div className="absolute inset-0 rounded-full border-2 border-[#A8C8E8]/30 border-t-[#A8C8E8] animate-spin" />
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
          <div className="flex-1 h-px" style={{ backgroundColor: C.border }} />
          <span className="text-xs font-medium" style={{ color: C.textM }}>أو</span>
          <div className="flex-1 h-px" style={{ backgroundColor: C.border }} />
        </div>

        {/* ── رابط الانتقال لإنشاء الحساب ── */}
        <p className="text-center text-xs sm:text-sm" style={{ color: C.textM }}>
          ليس لديك حساب؟{" "}
          <Link
            href="/auth/signup"
            className="font-bold relative after:absolute after:bottom-0 after:right-0 after:h-[2px] after:w-0 after:bg-[#A8C8E8] after:transition-all after:duration-300 hover:after:w-full"
            style={{ color: C.textP }}
          >
            أنشئ حساباً
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}