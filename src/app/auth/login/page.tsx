"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   صفحة تسجيل الدخول  /auth/login

   - متجاوبة مع جميع الشاشات (موبايل → تابلت → سطح مكتب)
   - تعتمد على إطار العمل Tailwind CSS ومكتبة الأيقونات lucide-react
   - تقوم بإرسال البيانات (POST) إلى السيرفر:
     https://educationplatform2-production.up.railway.app/auth/login
   - الألوان المستخدمة: #0A2947 / #A8C8E8 / #FFF2DB / #FFFAF3
───────────────────────────────────────────────────────────────────────────── */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, LogIn, Lock, AlertCircle, CheckCircle2, AtSign
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  /* 
   * ── حالة النموذج (Form State) ──
   * نحتاج فقط لاسم المستخدم وكلمة المرور بناءً على مسار الـ API
   */
  const [userName, setUserName] = useState(""); // اسم المستخدم — بحرف N كبير (camelCase) كما يتوقعه الباك إند
  const [password, setPassword] = useState("");

  /* 
   * ── حالة الواجهة (UI State) ──
   */
  const [showPassword, setShowPassword] = useState(false); // إظهار أو إخفاء كلمة المرور
  const [loading, setLoading]           = useState(false); // حالة التحميل
  const [success, setSuccess]           = useState("");    // رسالة النجاح

  // رسائل الخطأ لكل حقل
  const [errors, setErrors]             = useState<{ userName?: string; password?: string; general?: string }>({});

  /* 
   * ── دالة التحقق الفردي (Warner for each input) ──
   * تعمل بمجرد أن يترك المستخدم الحقل (onBlur) لتعطيه تنبيهاً فورياً
   */
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

  /* 
   * ── معالج الإرسال (Submit Handler) ──
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setErrors({});

    // التحقق من الحقول قبل الإرسال
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

      // الاتصال برابط الـ API لإتمام تسجيل الدخول
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, password }), // userName بحرف N كبير كما يتوقعه الباك إند
      });

      const data = await res.json().catch(() => ({}));

      // في حال فشل تسجيل الدخول
      if (!res.ok) {
        const detail =
          data?.errorDetails?.[0]?.message ||
          data?.message ||
          "اسم المستخدم أو كلمة المرور غير صحيحة.";
        throw new Error(detail);
      }

      // ── في حال النجاح ──
      // حفظ التوكن وبيانات المستخدم في الـ localStorage
      if (data?.data?.token) {
        localStorage.setItem("token", data.data.token);
      }
      if (data?.data?.user) {
        localStorage.setItem("user", JSON.stringify(data.data.user));
      }

      setSuccess("تم تسجيل الدخول بنجاح! جارٍ التحويل…");
      // تحويل المستخدم إلى لوحة التحكم (صفحة الطالب)
      setTimeout(() => router.push("/student"), 600);
    } catch (err: unknown) {
      setErrors({ general: err instanceof Error ? err.message : "حدث خطأ غير متوقع." });
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────────────── بدء واجهة المستخدم (JSX) ─────────────────────── */
  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-[#FFFAF3] px-4 py-8 sm:py-12">
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
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0A2947] flex items-center justify-center shadow-lg
                          transition-transform duration-300 hover:scale-105">
            <LogIn className="w-7 h-7 sm:w-8 sm:h-8 text-[#A8C8E8]" />
          </div>
        </div>

        {/* ── العنوان والوصف ── */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A2947] text-center tracking-tight mb-1">
          أهلاً بعودتك
        </h1>
        <p className="text-center text-gray-400 text-xs sm:text-sm mb-6 sm:mb-8">
          سجّل دخولك للمتابعة إلى حسابك
        </p>

        {/* ── رسالة الخطأ العامة ── */}
        {errors.general && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700
                          rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 mb-4 sm:mb-5 text-xs sm:text-sm font-medium
                          animate-[fadeUp_0.25s_ease-out_forwards]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* ── رسالة النجاح ── */}
        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700
                          rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 mb-4 sm:mb-5 text-xs sm:text-sm font-medium
                          animate-[fadeUp_0.25s_ease-out_forwards]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* ── نموذج الإدخال ── */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

          {/* ── حقل اسم المستخدم ── */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <label htmlFor="login-username" className="text-xs sm:text-sm font-semibold text-[#0A2947]">
              اسم المستخدم
            </label>
            <div className="relative group">
              <AtSign className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2
                               w-4 h-4 text-gray-400 pointer-events-none
                               transition-colors duration-200 group-focus-within:text-[#0A2947]" />
              <input
                id="login-username"
                type="text"
                placeholder="user_123"
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  // إخفاء الخطأ فوراً عند البدء في الكتابة
                  if (errors.userName) setErrors(prev => ({ ...prev, userName: undefined }));
                }}
                onBlur={(e) => handleBlur("userName", e.target.value)}
                required
                className={`w-full pr-9 sm:pr-10 pl-4 py-2.5 sm:py-3 rounded-xl
                           border-2 bg-[#FFFAF3] text-[#0A2947] placeholder-gray-300 text-sm
                           outline-none transition-all duration-300
                           focus:bg-white
                           ${errors.userName 
                             ? 'border-red-400 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(248,113,113,0.2)]' 
                             : 'border-[#FFF2DB] focus:border-[#A8C8E8] focus:shadow-[0_0_0_4px_rgba(168,200,232,0.35)] hover:border-[#A8C8E8]/60'
                           }`}
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
            <label htmlFor="login-password" className="text-xs sm:text-sm font-semibold text-[#0A2947]">
              كلمة المرور
            </label>
            <div className="relative group">
              <Lock className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2
                              w-4 h-4 text-gray-400 pointer-events-none
                              transition-colors duration-200 group-focus-within:text-[#0A2947]" />
              <input
                id="login-password"
                // التبديل بين إظهار نص أو كلمة سر
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                }}
                onBlur={(e) => handleBlur("password", e.target.value)}
                required
                className={`w-full pr-9 sm:pr-10 pl-10 sm:pl-11 py-2.5 sm:py-3 rounded-xl
                           border-2 bg-[#FFFAF3] text-[#0A2947] placeholder-gray-300 text-sm
                           outline-none transition-all duration-300
                           focus:bg-white
                           ${errors.password 
                             ? 'border-red-400 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(248,113,113,0.2)]' 
                             : 'border-[#FFF2DB] focus:border-[#A8C8E8] focus:shadow-[0_0_0_4px_rgba(168,200,232,0.35)] hover:border-[#A8C8E8]/60'
                           }`}
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2
                           text-gray-400 hover:text-[#0A2947]
                           transition-all duration-200
                           p-1 rounded-md hover:bg-[#FFF2DB]
                           active:scale-90"
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
            className="
              w-full py-3 sm:py-3.5 rounded-xl
              bg-[#0A2947] text-[#FFFAF3]
              font-bold text-sm tracking-wide
              flex items-center justify-center gap-2 mt-1
              transition-all duration-300 ease-in-out
              hover:bg-[#0d365e] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(10,41,71,0.3)]
              active:translate-y-0 active:shadow-md active:scale-[0.98]
              disabled:opacity-60 disabled:cursor-not-allowed
              translate-y-0 shadow-none scale-100
              cursor-pointer
            "
          >
            {loading ? (
              <>
                <div className="relative w-5 h-5">
                  <div className="absolute inset-0 rounded-full border-2
                                  border-[#A8C8E8]/30 border-t-[#A8C8E8] animate-spin" />
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

        {/* ── رابط الانتقال لإنشاء الحساب ── */}
        <p className="text-center text-xs sm:text-sm text-gray-400">
          ليس لديك حساب؟{" "}
          <Link
            href="/auth/signup"
            className="text-[#0A2947] font-bold
                       relative after:absolute after:bottom-0 after:right-0
                       after:h-[2px] after:w-0 after:bg-[#0A2947]
                       after:transition-all after:duration-300
                       hover:after:w-full"
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