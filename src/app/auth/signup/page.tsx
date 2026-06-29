"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   صفحة إنشاء الحساب  /auth/signup
   - متجاوبة مع جميع الشاشات (موبايل → تابلت → سطح مكتب)
   - تعتمد على إطار العمل Tailwind CSS ومكتبة الأيقونات lucide-react
   - دعم الوضع الليلي عبر ThemeProvider
───────────────────────────────────────────────────────────────────────────── */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, UserPlus, Lock, User, Phone, AlertCircle, CheckCircle2, AtSign, GraduationCap
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { getColors } from "@/lib/theme/colors";
import ThemeToggle from "@/components/ThemeToggle";

export default function SignupPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);
  const tr = "transition-all duration-300 ease-in-out";

  const [fullName, setFullName]               = useState("");
  const [userName, setUserName]               = useState("");
  const [phoneNumber, setPhoneNumber]         = useState("");
  const [level, setLevel]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState("");

  const [errors, setErrors]             = useState<{
    fullName?: string;
    username?: string;
    phoneNumber?: string;
    level?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const suggestUserName = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newUserName = `student_${randomNum}`;
    setUserName(newUserName);
    if (errors.username) setErrors(prev => ({ ...prev, username: undefined }));
  };

  const handleBlur = (field: string, value: string) => {
    let error: string | undefined = undefined;
    switch (field) {
      case "fullName":
        if (!value) error = "الاسم الكامل مطلوب";
        else if (!/^[\u0621-\u064A\s]+$/.test(value)) error = "يجب أن يكون الاسم باللغة العربية فقط";
        else if (value.trim().split(/\s+/).length < 3) error = "يجب أن يكون الاسم ثلاثياً على الأقل";
        break;
      case "userName":
        if (!value) error = "اسم المستخدم مطلوب";
        else if (value.length < 3) error = "اسم المستخدم يجب أن يكون 3 أحرف على الأقل";
        else if (!/^[a-zA-Z0-9_]+$/.test(value)) error = "اسم المستخدم يجب أن يحتوي على حروف إنجليزية وأرقام فقط (بدون مسافات)";
        break;
      case "phoneNumber":
        if (!value) error = "رقم الهاتف مطلوب";
        else if (!/^(?:\+20|0)1[0125][0-9]{8}$/.test(value)) error = "رقم الهاتف غير صحيح (يجب أن يكون رقماً مصرياً)";
        break;
      case "level":
        if (!value) error = "المرحلة الدراسية مطلوبة";
        break;
      case "password":
        if (!value) error = "كلمة المرور مطلوبة";
        else if (value.length < 8) error = "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
        break;
      case "confirmPassword":
        if (!value) error = "تأكيد كلمة المرور مطلوب";
        else if (value !== password) error = "كلمتا المرور غير متطابقتين";
        break;
    }
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setErrors({});

    const validationErrors: {
      fullName?: string; username?: string; phoneNumber?: string;
      level?: string; password?: string; confirmPassword?: string; general?: string;
    } = {};

    if (!fullName) validationErrors.fullName = "الاسم الكامل مطلوب";
    else if (!/^[\u0621-\u064A\s]+$/.test(fullName)) validationErrors.fullName = "يجب أن يكون الاسم باللغة العربية فقط";
    else if (fullName.trim().split(/\s+/).length < 3) validationErrors.fullName = "يجب أن يكون الاسم ثلاثياً على الأقل";

    if (!userName) validationErrors.username = "اسم المستخدم مطلوب";
    else if (userName.length < 3) validationErrors.username = "اسم المستخدم يجب أن يكون 3 أحرف على الأقل";
    else if (!/^[a-zA-Z0-9_]+$/.test(userName)) validationErrors.username = "اسم المستخدم يجب أن يحتوي على حروف إنجليزية وأرقام فقط (بدون مسافات)";

    if (!phoneNumber) validationErrors.phoneNumber = "رقم الهاتف مطلوب";
    else if (!/^(?:\+20|0)1[0125][0-9]{8}$/.test(phoneNumber)) validationErrors.phoneNumber = "رقم الهاتف غير صحيح (يجب أن يكون رقماً مصرياً)";

    if (!level) validationErrors.level = "المرحلة الدراسية مطلوبة";

    if (!password) validationErrors.password = "كلمة المرور مطلوبة";
    else if (password.length < 8) validationErrors.password = "كلمة المرور يجب أن تكون 8 أحرف على الأقل";

    if (password !== confirmPassword) {
      validationErrors.confirmPassword = "كلمتا المرور غير متطابقتين";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://educationplatform2-production.up.railway.app";
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, userName, password, phoneNumber, level }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        let detail = data?.errorDetails?.[0]?.message || data?.message || "فشل إنشاء الحساب. الرجاء التحقق من البيانات.";
        if (detail.includes("Invalid option") || detail.includes("expected one of")) {
          detail = "عذراً، المرحلة الدراسية التي اخترتها غير مفعلة حالياً في الخادم. (يرجى مراجعة الإدارة)";
        } else if (detail.toLowerCase().includes("exist") || detail.toLowerCase().includes("taken")) {
          detail = "اسم المستخدم أو رقم الهاتف أو البريد الإلكتروني مسجل مسبقاً.";
        }
        throw new Error(detail);
      }

      let token = data?.data?.token || data?.token || data?.accessToken;
      let userObj = data?.data?.user || data?.user || data?.data;

      // تسجيل الدخول التلقائي في حال لم يرسل الباك إند المفتاح (Token)
      if (!token) {
        try {
          const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userName, password }),
          });
          if (loginRes.ok) {
            const loginData = await loginRes.json().catch(() => ({}));
            token = loginData?.data?.token || loginData?.token || loginData?.accessToken;
            userObj = loginData?.data?.user || loginData?.user || loginData?.data;
          }
        } catch (err) {
          console.error("Auto login failed:", err);
        }
      }

      // حفظ التوكن والبيانات في المتصفح
      if (token) {
        localStorage.setItem("token", token);
      }
      if (userObj) {
        localStorage.setItem("user", JSON.stringify(userObj));
      }

      setSuccess("تم التسجيل وتأكيد الدخول بنجاح! جارٍ التحويل…");
      
      // التوجيه
      if (token) {
        setTimeout(() => router.push("/student"), 600);
      } else {
        setTimeout(() => router.push("/auth/login"), 1500);
      }
    } catch (err: unknown) {
      setErrors({ general: err instanceof Error ? err.message : "حدث خطأ غير متوقع." });
    } finally {
      setLoading(false);
    }
  };

  const eyeBtnBase = `
    absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2
    transition-all duration-200
    p-1 rounded-md hover:bg-[#A8C8E8]/20
    active:scale-90 cursor-pointer
  `;

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
        <div className="flex justify-center mb-5 sm:mb-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0A2947] flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105">
            <UserPlus className="w-7 h-7 sm:w-8 sm:h-8 text-[#A8C8E8]" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-center tracking-tight mb-1" style={{ color: C.textP }}>
          إنشاء حساب جديد
        </h1>
        <p className="text-center text-xs sm:text-sm mb-6 sm:mb-8" style={{ color: C.textM }}>
          انضم إلينا اليوم — التسجيل لا يأخذ سوى لحظات
        </p>

        {errors.general && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 mb-4 sm:mb-5 text-xs sm:text-sm font-medium animate-[fadeUp_0.25s_ease-out_forwards]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 mb-4 sm:mb-5 text-xs sm:text-sm font-medium animate-[fadeUp_0.25s_ease-out_forwards]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* الاسم الكامل */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <label htmlFor="signup-name" className="text-xs sm:text-sm font-semibold" style={{ color: C.textP }}>الاسم الكامل</label>
            <div className="relative group">
              <User className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200" style={{ color: C.textM }} />
              <input
                id="signup-name" type="text" placeholder="محمد أحمد علي" value={fullName}
                onChange={(e) => { setFullName(e.target.value); if (errors.fullName) setErrors(prev => ({ ...prev, fullName: undefined })); }}
                onBlur={(e) => handleBlur("fullName", e.target.value)}
                className={`w-full pr-9 sm:pr-10 pl-4 py-2.5 sm:py-3 rounded-xl border-2 text-sm outline-none transition-all duration-300 focus:shadow-[0_0_0_4px_rgba(168,200,232,0.35)] ${errors.fullName ? 'border-red-400 focus:border-red-500' : ''}`}
                style={{ backgroundColor: C.input, color: C.textP, borderColor: errors.fullName ? undefined : C.border }}
              />
            </div>
            {errors.fullName && (
              <span className="text-red-500 text-xs font-medium flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.fullName}</span>
            )}
          </div>

          {/* اسم المستخدم */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="signup-username" className="text-xs sm:text-sm font-semibold" style={{ color: C.textP }}>اسم المستخدم</label>
              <button type="button" onClick={suggestUserName} className="text-[10px] sm:text-xs bg-[#0A2947] text-[#A8C8E8] px-2 py-1 rounded-md font-bold transition-colors shadow-sm hover:opacity-80">اقتراح اسم؟</button>
            </div>
            <div className="relative group">
              <AtSign className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200" style={{ color: C.textM }} />
              <input
                id="signup-username" type="text" placeholder="user_123" value={userName} dir="ltr"
                onChange={(e) => { setUserName(e.target.value); if (errors.username) setErrors(prev => ({ ...prev, username: undefined })); }}
                onBlur={(e) => handleBlur("userName", e.target.value)}
                className={`w-full pr-9 sm:pr-10 pl-4 py-2.5 sm:py-3 rounded-xl border-2 text-sm outline-none transition-all duration-300 focus:shadow-[0_0_0_4px_rgba(168,200,232,0.35)] ${errors.username ? 'border-red-400 focus:border-red-500' : ''}`}
                style={{ backgroundColor: C.input, color: C.textP, borderColor: errors.username ? undefined : C.border }}
              />
            </div>
            {errors.username && (
              <span className="text-red-500 text-xs font-medium flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.username}</span>
            )}
          </div>

          {/* رقم الهاتف */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <label htmlFor="signup-phone" className="text-xs sm:text-sm font-semibold" style={{ color: C.textP }}>رقم الهاتف</label>
            <div className="relative group">
              <Phone className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200" style={{ color: C.textM }} />
              <input
                id="signup-phone" type="tel" placeholder="01XXXXXXXXX" value={phoneNumber} dir="ltr"
                onChange={(e) => { const val = e.target.value.replace(/[^\d+]/g, ""); setPhoneNumber(val); if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: undefined })); }}
                onBlur={(e) => handleBlur("phoneNumber", e.target.value.replace(/[^\d+]/g, ""))}
                className={`w-full pr-9 sm:pr-10 pl-4 py-2.5 sm:py-3 rounded-xl border-2 text-sm outline-none transition-all duration-300 focus:shadow-[0_0_0_4px_rgba(168,200,232,0.35)] ${errors.phoneNumber ? 'border-red-400 focus:border-red-500' : ''}`}
                style={{ backgroundColor: C.input, color: C.textP, borderColor: errors.phoneNumber ? undefined : C.border }}
              />
            </div>
            {errors.phoneNumber && (
              <span className="text-red-500 text-xs font-medium flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.phoneNumber}</span>
            )}
          </div>

          {/* المرحلة الدراسية */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <label htmlFor="signup-level" className="text-xs sm:text-sm font-semibold" style={{ color: C.textP }}>المرحلة الدراسية</label>
            <div className="relative group">
              <GraduationCap className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200" style={{ color: C.textM }} />
              <select
                id="signup-level" value={level}
                onChange={(e) => { setLevel(e.target.value); if (errors.level) setErrors(prev => ({ ...prev, level: undefined })); }}
                onBlur={(e) => handleBlur("level", e.target.value)}
                className={`w-full pr-9 sm:pr-10 pl-4 appearance-none py-2.5 sm:py-3 rounded-xl border-2 text-sm outline-none transition-all duration-300 focus:shadow-[0_0_0_4px_rgba(168,200,232,0.35)] ${errors.level ? 'border-red-400 focus:border-red-500' : ''}`}
                style={{ backgroundColor: C.input, color: C.textP, borderColor: errors.level ? undefined : C.border }}
              >
                <option value="" disabled>اختر المرحلة الدراسية</option>
                <optgroup label="المرحلة الابتدائية" style={{ backgroundColor: C.card, color: C.textP }}>
                  <option value="one">الصف الأول الابتدائي</option>
                  <option value="two">الصف الثاني الابتدائي</option>
                  <option value="three">الصف الثالث الابتدائي</option>
                  <option value="four">الصف الرابع الابتدائي</option>
                  <option value="five">الصف الخامس الابتدائي</option>
                  <option value="six">الصف السادس الابتدائي</option>
                </optgroup>
                <optgroup label="المرحلة الإعدادية" style={{ backgroundColor: C.card, color: C.textP }}>
                  <option value="seven">الصف الأول الإعدادي</option>
                  <option value="eight">الصف الثاني الإعدادي</option>
                  <option value="nine">الصف الثالث الإعدادي</option>
                </optgroup>
                <optgroup label="المرحلة الثانوية" style={{ backgroundColor: C.card, color: C.textP }}>
                  <option value="ten">الصف الأول الثانوي</option>
                  <option value="eleven">الصف الثاني الثانوي</option>
                  <option value="twelve">الصف الثالث الثانوي</option>
                </optgroup>
              </select>
            </div>
            {errors.level && (
              <span className="text-red-500 text-xs font-medium flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.level}</span>
            )}
          </div>

          {/* كلمة المرور */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <label htmlFor="signup-password" className="text-xs sm:text-sm font-semibold" style={{ color: C.textP }}>كلمة المرور</label>
            <div className="relative group">
              <Lock className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200" style={{ color: C.textM }} />
              <input
                id="signup-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} dir="ltr"
                onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(prev => ({ ...prev, password: undefined })); }}
                onBlur={(e) => handleBlur("password", e.target.value)}
                className={`w-full pr-9 sm:pr-10 pl-10 sm:pl-11 py-2.5 sm:py-3 rounded-xl border-2 text-sm outline-none transition-all duration-300 focus:shadow-[0_0_0_4px_rgba(168,200,232,0.35)] ${errors.password ? 'border-red-400 focus:border-red-500' : ''}`}
                style={{ backgroundColor: C.input, color: C.textP, borderColor: errors.password ? undefined : C.border }}
              />
              <button
                type="button" onClick={() => setShowPassword((p) => !p)} className={eyeBtnBase} style={{ color: C.textM }} aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password ? (
              <span className="text-red-500 text-xs font-medium flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.password}</span>
            ) : (
              <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: C.textM }}>٨ أحرف على الأقل</p>
            )}
          </div>

          {/* تأكيد كلمة المرور */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <label htmlFor="signup-confirm" className="text-xs sm:text-sm font-semibold" style={{ color: C.textP }}>تأكيد كلمة المرور</label>
            <div className="relative group">
              <Lock className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200" style={{ color: C.textM }} />
              <input
                id="signup-confirm" type={showConfirm ? "text" : "password"} placeholder="••••••••" value={confirmPassword} dir="ltr"
                onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined })); }}
                onBlur={(e) => handleBlur("confirmPassword", e.target.value)}
                className={`w-full pr-9 sm:pr-10 pl-10 sm:pl-11 py-2.5 sm:py-3 rounded-xl border-2 text-sm outline-none transition-all duration-300 focus:shadow-[0_0_0_4px_rgba(168,200,232,0.35)] ${errors.confirmPassword ? 'border-red-400 focus:border-red-500' : ''}`}
                style={{ backgroundColor: C.input, color: C.textP, borderColor: errors.confirmPassword ? undefined : C.border }}
              />
              <button
                type="button" onClick={() => setShowConfirm((p) => !p)} className={eyeBtnBase} style={{ color: C.textM }} aria-label={showConfirm ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="text-red-500 text-xs font-medium flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 sm:py-3.5 rounded-xl bg-[#0A2947] text-[#FFFAF3] font-bold text-sm tracking-wide flex items-center justify-center gap-2 mt-1 transition-all duration-300 ease-in-out hover:bg-[#0d365e] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(10,41,71,0.3)] active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="relative w-5 h-5">
                  <div className="absolute inset-0 rounded-full border-2 border-[#A8C8E8]/30 border-t-[#A8C8E8] animate-spin" />
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

        <div className="flex items-center gap-3 my-5 sm:my-6">
          <div className="flex-1 h-px" style={{ backgroundColor: C.border }} />
          <span className="text-xs font-medium" style={{ color: C.textM }}>أو</span>
          <div className="flex-1 h-px" style={{ backgroundColor: C.border }} />
        </div>

        <p className="text-center text-xs sm:text-sm" style={{ color: C.textM }}>
          لديك حساب بالفعل؟{" "}
          <Link
            href="/auth/login"
            className="font-bold relative after:absolute after:bottom-0 after:right-0 after:h-[2px] after:w-0 after:bg-[#A8C8E8] after:transition-all after:duration-300 hover:after:w-full"
            style={{ color: C.textP }}
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