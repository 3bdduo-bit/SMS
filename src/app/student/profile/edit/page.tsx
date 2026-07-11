"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   صفحة تعديل الملف الشخصي  /student/profile/edit

   - GET /user/profile لملء الحقول + PUT /user/profile للتحديث
   - دعم الوضع الليلي عبر useTheme Context
   - Tailwind CSS + lucide-react + RTL
───────────────────────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock, Eye, EyeOff, Save, GraduationCap,
  LogOut, AlertCircle, CheckCircle2, RefreshCw, Home
} from "lucide-react";
import { getProfile, updateUser } from "@/lib/api/user";
import { useTheme } from "@/components/ThemeProvider";
import { getColors, ThemeColors } from "@/lib/theme/colors";
import ThemeToggle from "@/components/ThemeToggle";

/* ── نوع أخطاء النموذج ── */
interface FormErrors {
  fullName?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

/* ════════════════════════════════════════════════════════════════════════════
   المكوّن الرئيسي
════════════════════════════════════════════════════════════════════════════ */
export default function EditProfilePage() {
  const router     = useRouter();
  const { isDark } = useTheme();
  const C          = getColors(isDark);
  const tr         = "transition-all duration-300 ease-in-out";

  /* ── بيانات النموذج ── */
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);

  /* ── حالة الواجهة ── */
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [fetchError, setFetchError]         = useState("");
  const [submitting, setSubmitting]         = useState(false);
  const [success, setSuccess]               = useState("");
  const [errors, setErrors]                 = useState<FormErrors>({});

  /* ── جلب البيانات الحالية للتحقق (اختياري) ── */
  const fetchAndFill = useCallback(async () => {
    setLoadingProfile(true); setFetchError("");
    try {
      await getProfile(); // Just to verify token is valid and user exists
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : "فشل في التحقق من الحساب.");
    } finally { setLoadingProfile(false); }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAndFill();
  }, [fetchAndFill]);

  /* ── تسجيل الخروج ── */
  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.push("/auth/login"); };

  /* ── التحقق من الحقول ── */
  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!password)                                                    e.password        = "كلمة المرور مطلوبة.";
    else if (password.length < 6)                                     e.password        = "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";
    if (password !== confirmPassword)                                 e.confirmPassword = "كلمتا المرور غير متطابقتان.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── معالج الإرسال ── */
  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault(); setSuccess(""); setErrors({});
    if (!validate()) return;

    const payload: Record<string, string> = { password };

    setSubmitting(true);
    try {
      await updateUser(payload);
      setSuccess("تم تغيير كلمة المرور بنجاح!");
      setPassword(""); setConfirmPassword("");
      setTimeout(() => router.push("/student/profile"), 2000);
    } catch (err: unknown) {
      setErrors({ general: err instanceof Error ? err.message : "حدث خطأ أثناء التحديث." });
    } finally { setSubmitting(false); }
  };

  /* ── حالة التحميل ── */
  if (loadingProfile) return (
    <div className={`min-h-[100dvh] flex items-center justify-center ${tr}`} style={{ backgroundColor: C.page }} dir="rtl">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-[#A8C8E8]/30 border-t-[#0A2947] animate-spin" />
        <p className="font-semibold" style={{ color: C.textP }}>جارٍ تحميل البيانات…</p>
      </div>
    </div>
  );

  /* ── خطأ جلب البيانات ── */
  if (fetchError) return (
    <div className={`min-h-[100dvh] flex items-center justify-center px-4 ${tr}`} style={{ backgroundColor: C.page }} dir="rtl">
      <div className="rounded-3xl p-8 max-w-sm w-full text-center shadow-xl" style={{ backgroundColor: C.card, border: `2px solid ${C.border}` }}>
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-extrabold mb-2" style={{ color: C.textP }}>خطأ في التحميل</h2>
        <p className="text-sm mb-6" style={{ color: C.textM }}>{fetchError}</p>
        <button onClick={fetchAndFill} className="w-full bg-[#0A2947] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#0d365e] transition-colors">
          <RefreshCw className="w-4 h-4" /> إعادة المحاولة
        </button>
      </div>
    </div>
  );

  /* ══════════════════════ الواجهة الرئيسية ══════════════════════ */
  return (
    <div className={`min-h-[100dvh] ${tr}`} style={{ backgroundColor: C.page, color: C.textP }} dir="rtl">

      {/* ══════════ navbar ══════════ */}
      <nav
        className={`px-4 sm:px-8 py-3 flex justify-between items-center sticky top-0 z-50 ${tr}`}
        style={{ backgroundColor: C.nav, borderBottom: `1px solid ${C.border}`, boxShadow: C.navShadow }}
      >
        <Link
          href="/student/profile"
          className="p-2 rounded-xl hover:bg-black/5 transition-colors group flex items-center justify-center"
          title="العودة للرئيسية"
        >
          <Home className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" style={{ color: C.textP }} />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#0A2947] flex items-center justify-center shadow-md">
            <GraduationCap className="text-[#A8C8E8] w-5 h-5" />
          </div>
          <span className="font-extrabold hidden sm:block" style={{ color: C.textP }}>تغيير كلمة المرور</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-red-500 hover:text-red-700 font-semibold text-sm transition-colors px-3 py-2 rounded-xl hover:bg-red-50">
            <LogOut className="w-4 h-4" /><span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </nav>

      {/* ══════════ المحتوى ══════════ */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-[fadeUp_0.4s_ease-out_both]">

        {/* ── ترويسة ── */}
        <div className="mb-8 text-center sm:text-right">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ color: C.textP }}>تغيير كلمة المرور</h1>
          <p className="text-sm" style={{ color: C.textM }}>قم بتعيين كلمة مرور جديدة لحسابك.</p>
        </div>

        {/* ── بطاقة النموذج ── */}
        <div className={`rounded-3xl p-6 sm:p-8 shadow-xl ${tr}`} style={{ backgroundColor: C.card, border: `2px solid ${C.border}` }}>

          {/* رسالة النجاح */}
          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-6 text-sm font-medium animate-[fadeUp_0.25s_ease-out]">
              <CheckCircle2 className="w-4 h-4 shrink-0" /><span>{success}</span>
            </div>
          )}

          {/* رسالة الخطأ العامة */}
          {errors.general && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm font-medium animate-[fadeUp_0.25s_ease-out]">
              <AlertCircle className="w-4 h-4 shrink-0" /><span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <PasswordField C={C} id="edit-password" label="كلمة المرور الجديدة" value={password}        onChange={setPassword}        error={errors.password}        show={showPassword} onToggle={() => setShowPassword(p => !p)} />
            <PasswordField C={C} id="edit-confirm"   label="تأكيد كلمة المرور"   value={confirmPassword} onChange={setConfirmPassword} error={errors.confirmPassword} show={showConfirm}  onToggle={() => setShowConfirm(p => !p)} />

            {/* ── زر الحفظ ── */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-[#0A2947] text-[#FFFAF3] font-bold text-sm flex items-center justify-center gap-2 mt-2 transition-all duration-300 hover:bg-[#0d365e] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(10,41,71,0.3)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting
                ? <><div className="w-4 h-4 border-2 border-[#A8C8E8]/30 border-t-[#A8C8E8] rounded-full animate-spin" /> جارٍ الحفظ…</>
                : <><Save className="w-4 h-4" /> حفظ التعديلات</>
              }
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}


/* ── PasswordField — حقل كلمة المرور مع زر الإظهار ── */
function PasswordField({ C, id, label, value, onChange, error, show, onToggle }: {
  C: ThemeColors; id: string; label: string; value: string;
  onChange: (v: string) => void; error?: string; show: boolean; onToggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs sm:text-sm font-semibold" style={{ color: C.textP }}>{label}</label>
      <div className="relative group">
        <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.textM }} />
        <input
          id={id} type={show ? "text" : "password"} placeholder="••••••••" value={value}
          onChange={e => onChange(e.target.value)}
          className={`w-full pr-10 pl-11 py-3 rounded-xl text-sm outline-none transition-all duration-300 ${error ? "focus:shadow-[0_0_0_4px_rgba(248,113,113,0.2)]" : "focus:shadow-[0_0_0_4px_rgba(168,200,232,0.35)]"}`}
          style={{ backgroundColor: C.input, color: C.textP, border: `2px solid ${error ? "#f87171" : C.border}` }}
          dir="ltr"
        />
        <button type="button" onClick={onToggle} className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-all" style={{ color: C.textM }}>
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <span className="text-red-500 text-xs font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</span>}
    </div>
  );
}
