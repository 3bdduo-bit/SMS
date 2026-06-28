"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   صفحة إنشاء الحساب  /auth/signup

   - متجاوبة مع جميع الشاشات (موبايل → تابلت → سطح مكتب)
   - Tailwind CSS + lucide-react + Next/Image
   - POST → https://educationplatform2-production.up.railway.app/auth/register
   - الألوان: #0A2947 / #A8C8E8 / #FFF2DB / #FFFAF3
───────────────────────────────────────────────────────────────────────────── */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, UserPlus, Mail, Lock, User, Phone, AlertCircle, CheckCircle2,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  /* ── حالة النموذج ── */
  const [fullName, setFullName]               = useState("");
  const [email, setEmail]                     = useState("");
  const [phoneNumber, setPhoneNumber]         = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /* ── حالة الواجهة ── */
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [errors, setErrors]             = useState<{
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [success, setSuccess]           = useState("");

  /* ── معالج الإرسال ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setErrors({});

    const validationErrors: {
      fullName?: string;
      email?: string;
      phoneNumber?: string;
      password?: string;
      confirmPassword?: string;
      general?: string;
    } = {};

    if (!fullName) validationErrors.fullName = "الاسم الكامل مطلوب";
    else if (!/^[\u0621-\u064A\s]+$/.test(fullName)) validationErrors.fullName = "يجب أن يكون الاسم باللغة العربية فقط";
    else if (fullName.trim().split(/\s+/).length < 3) validationErrors.fullName = "يجب أن يكون الاسم ثلاثياً على الأقل";

    if (!email) validationErrors.email = "البريد الإلكتروني مطلوب";
    else if (!/^\S+@\S+\.\S+$/.test(email)) validationErrors.email = "صيغة البريد غير صحيحة";

    if (!phoneNumber) validationErrors.phoneNumber = "رقم الهاتف مطلوب";
    else if (!/^(?:\+20|0)1[0125][0-9]{8}$/.test(phoneNumber)) validationErrors.phoneNumber = "رقم الهاتف غير صحيح (يجب أن يكون رقماً مصرياً)";

    if (!password) validationErrors.password = "كلمة المرور مطلوبة";
    else if (password.length < 6) validationErrors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";

    if (password !== confirmPassword) {
      validationErrors.confirmPassword = "كلمتا المرور غير متطابقتين";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://educationplatform2-production.up.railway.app";

      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, phoneNumber }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // لو الباك إند رجع errorDetails (joi/zod) نعرض أول رسالة مفيدة
        const detail =
          data?.errorDetails?.[0]?.message ||
          data?.message ||
          "فشل إنشاء الحساب. ربما البريد الإلكتروني مستخدم بالفعل.";
        throw new Error(detail);
      }

      setSuccess("تم إنشاء الحساب بنجاح! جارٍ التحويل…");
      setTimeout(() => router.push("/student"), 600);
    } catch (err: unknown) {
      setErrors({ general: err instanceof Error ? err.message : "حدث خطأ غير متوقع." });
    } finally {
      setLoading(false);
    }
  };

  /* ── دالة للكلاس المشترك لحقول الإدخال ── */
  const getInputClass = (errorMsg?: string) => `
    w-full py-2.5 sm:py-3 rounded-xl border-2 bg-[#FFFAF3]
    text-[#0A2947] placeholder-gray-300 text-sm
    outline-none transition-all duration-300 focus:bg-white
    ${errorMsg
      ? "border-red-400 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(248,113,113,0.2)]"
      : "border-[#FFF2DB] focus:border-[#A8C8E8] focus:shadow-[0_0_0_4px_rgba(168,200,232,0.35)] hover:border-[#A8C8E8]/60"
    }
  `;

  /* ── كلاس مشترك لزر إظهار/إخفاء كلمة المرور ── */
  const eyeBtnBase = `
    absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2
    text-gray-400 hover:text-[#0A2947]
    transition-all duration-200
    p-1 rounded-md hover:bg-[#FFF2DB]
    active:scale-90 cursor-pointer
  `;

  /* ─────────────────────── JSX ─────────────────────── */
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
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0A2947]
                          flex items-center justify-center shadow-lg
                          transition-transform duration-300 hover:scale-105">
            <UserPlus className="w-7 h-7 sm:w-8 sm:h-8 text-[#A8C8E8]" />
          </div>
        </div>

        {/* ── العنوان والوصف ── */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A2947] text-center tracking-tight mb-1">
          إنشاء حساب جديد
        </h1>
        <p className="text-center text-gray-400 text-xs sm:text-sm mb-6 sm:mb-8">
          انضم إلينا اليوم — التسجيل لا يأخذ سوى لحظات
        </p>

        {/* ── رسالة الخطأ ── */}
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

        {/* ── النموذج ── */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

          {/* ── حقل الاسم الكامل ── */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <label htmlFor="signup-name" className="text-xs sm:text-sm font-semibold text-[#0A2947]">
              الاسم الكامل
            </label>
            <div className="relative group">
              <User className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2
                               w-4 h-4 text-gray-400 pointer-events-none
                               transition-colors duration-200 group-focus-within:text-[#0A2947]" />
              <input
                id="signup-name"
                type="text"
                placeholder="محمد أحمد علي"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors(prev => ({ ...prev, fullName: undefined }));
                }}
                required
                className={`pr-9 sm:pr-10 pl-4 ${getInputClass(errors.fullName)}`}
              />
            </div>
            {errors.fullName && (
              <span className="text-red-500 text-xs font-medium animate-[fadeUp_0.2s_ease-out_forwards] flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.fullName}
              </span>
            )}
          </div>

          {/* ── حقل البريد الإلكتروني ── */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <label htmlFor="signup-email" className="text-xs sm:text-sm font-semibold text-[#0A2947]">
              البريد الإلكتروني
            </label>
            <div className="relative group">
              <Mail className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2
                               w-4 h-4 text-gray-400 pointer-events-none
                               transition-colors duration-200 group-focus-within:text-[#0A2947]" />
              <input
                id="signup-email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                }}
                required
                className={`pr-9 sm:pr-10 pl-4 ${getInputClass(errors.email)}`}
              />
            </div>
            {errors.email && (
              <span className="text-red-500 text-xs font-medium animate-[fadeUp_0.2s_ease-out_forwards] flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.email}
              </span>
            )}
          </div>

          {/* ── حقل رقم الهاتف ── */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <label htmlFor="signup-phone" className="text-xs sm:text-sm font-semibold text-[#0A2947]">
              رقم الهاتف
            </label>
            <div className="relative group">
              <Phone className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2
                                w-4 h-4 text-gray-400 pointer-events-none
                                transition-colors duration-200 group-focus-within:text-[#0A2947]" />
              <input
                id="signup-phone"
                type="tel"
                placeholder="01XXXXXXXXX أو +201XXXXXXXXX"
                value={phoneNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d+]/g, "");
                  setPhoneNumber(val);
                  if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: undefined }));
                }}
                required
                className={`pr-9 sm:pr-10 pl-4 ${getInputClass(errors.phoneNumber)}`}
                dir="ltr"
              />
            </div>
            {errors.phoneNumber && (
              <span className="text-red-500 text-xs font-medium animate-[fadeUp_0.2s_ease-out_forwards] flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.phoneNumber}
              </span>
            )}
          </div>

          {/* ── حقل كلمة المرور ── */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <label htmlFor="signup-password" className="text-xs sm:text-sm font-semibold text-[#0A2947]">
              كلمة المرور
            </label>
            <div className="relative group">
              <Lock className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2
                              w-4 h-4 text-gray-400 pointer-events-none
                              transition-colors duration-200 group-focus-within:text-[#0A2947]" />
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                }}
                required
                className={`pr-9 sm:pr-10 pl-10 sm:pl-11 ${getInputClass(errors.password)}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className={eyeBtnBase}
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password ? (
              <span className="text-red-500 text-xs font-medium animate-[fadeUp_0.2s_ease-out_forwards] flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.password}
              </span>
            ) : (
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">٦ أحرف على الأقل</p>
            )}
          </div>

          {/* ── حقل تأكيد كلمة المرور ── */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <label htmlFor="signup-confirm" className="text-xs sm:text-sm font-semibold text-[#0A2947]">
              تأكيد كلمة المرور
            </label>
            <div className="relative group">
              <Lock className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2
                              w-4 h-4 text-gray-400 pointer-events-none
                              transition-colors duration-200 group-focus-within:text-[#0A2947]" />
              <input
                id="signup-confirm"
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                }}
                required
                className={`pr-9 sm:pr-10 pl-10 sm:pl-11 ${getInputClass(errors.confirmPassword)}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className={eyeBtnBase}
                aria-label={showConfirm ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="text-red-500 text-xs font-medium animate-[fadeUp_0.2s_ease-out_forwards] flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.confirmPassword}
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
                جارٍ إنشاء الحساب…
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                إنشاء الحساب
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

        {/* ── رابط تسجيل الدخول ── */}
        <p className="text-center text-xs sm:text-sm text-gray-400">
          لديك حساب بالفعل؟{" "}
          <Link
            href="/auth/login"
            className="text-[#0A2947] font-bold
                       relative after:absolute after:bottom-0 after:right-0
                       after:h-[2px] after:w-0 after:bg-[#0A2947]
                       after:transition-all after:duration-300
                       hover:after:w-full"
          >
            سجّل دخولك
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