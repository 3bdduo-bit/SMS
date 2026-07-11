"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   صفحة الملف الشخصي للمعلم  /teacher/profile

   - GET /user/profile بـ JWT token
   - دعم الوضع الليلي عبر useTheme Context
   - عرض الحرف الأول من fullName في الأفاتار
   - حذف الحساب مع Modal تأكيد
───────────────────────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User, Mail, Phone, Shield, Pencil, LogOut,
  ArrowRight, GraduationCap, AlertTriangle, RefreshCw, Calendar, BookOpen, KeyRound, ClipboardList
, Home } from "lucide-react";
import { getProfile, UserProfile } from "@/lib/api/user";
import { useTheme } from "@/components/ThemeProvider";
import { getColors, ThemeColors } from "@/lib/theme/colors";
import ThemeToggle from "@/components/ThemeToggle";

/* ── مساعدات ── */
const getInitial    = (p: UserProfile) => (p.fullName || p.name || p.userName || "م").charAt(0).toUpperCase();
const getDisplayName = (p: UserProfile) => p.fullName || p.name || p.userName || "المستخدم";
const formatDate    = (d?: string) => {
  if (!d) return "—";
  try { return new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "long", day: "numeric" }).format(new Date(d)); }
  catch { return d; }
};
const getRoleLabel = (r?: string) =>
  ({ student: "طالب", teacher: "معلم", admin: "مدير", instructor: "مدرّس" }[r?.toLowerCase() ?? ""] ?? (r || "مستخدم"));

/* ════════════════════════════════════════════════════════════════════════════
   المكوّن الرئيسي
════════════════════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const router       = useRouter();
  const { isDark }   = useTheme();
  const C            = getColors(isDark);
  const tr           = "transition-all duration-300 ease-in-out";

  const [profile, setProfile]               = useState<UserProfile | null>(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState("");

  /* ── جلب الملف الشخصي ── */
  const fetchProfile = useCallback(async () => {
    setLoading(true); setError("");
    try {
      setProfile(await getProfile());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ غير متوقع.";
      setError(msg);
      if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) router.push("/auth/login");
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  /* ── تسجيل الخروج ── */
  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.push("/auth/login"); };

  /* ── حالة التحميل ── */
  if (loading) return (
    <div className={`min-h-[100dvh] flex items-center justify-center ${tr}`} style={{ backgroundColor: C.page }} dir="rtl">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-[#A8C8E8]/30 border-t-[#0A2947] animate-spin" />
        <p className="font-semibold" style={{ color: C.textP }}>جارٍ تحميل الملف الشخصي…</p>
      </div>
    </div>
  );

  /* ── حالة الخطأ ── */
  if (error && !profile) return (
    <div className={`min-h-[100dvh] flex items-center justify-center px-4 ${tr}`} style={{ backgroundColor: C.page }} dir="rtl">
      <div className="rounded-3xl p-8 max-w-sm w-full text-center shadow-xl" style={{ backgroundColor: C.card, border: `2px solid ${C.border}` }}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-lg font-extrabold mb-2" style={{ color: C.textP }}>تعذّر التحميل</h2>
        <p className="text-sm mb-6" style={{ color: C.textM }}>{error}</p>
        <button onClick={fetchProfile} className="w-full bg-[#0A2947] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#0d365e] transition-colors">
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
          href="/teacher"
          className="p-2 rounded-xl hover:bg-black/5 transition-colors group flex items-center justify-center"
          title="العودة للرئيسية"
        >
          <Home className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" style={{ color: C.textP }} />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#0A2947] flex items-center justify-center shadow-md">
            <GraduationCap className="text-[#A8C8E8] w-5 h-5" />
          </div>
          <span className="font-extrabold hidden sm:block" style={{ color: C.textP }}>الملف الشخصي</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-red-500 hover:text-red-700 font-semibold text-sm transition-colors px-3 py-2 rounded-xl hover:bg-red-50">
            <LogOut className="w-4 h-4" /><span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </nav>

      {/* ══════════ المحتوى ══════════ */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-[fadeUp_0.4s_ease-out_both]">

        {/* ── بطاقة رأس الملف ── */}
        <div
          className={`relative rounded-3xl p-6 sm:p-10 text-white mb-6 overflow-hidden shadow-2xl ${tr}`}
          style={{ backgroundColor: C.hero }}
        >
          <div className="absolute -left-16 -top-16 w-64 h-64 bg-[#A8C8E8] rounded-full opacity-10 pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#FFF2DB] rounded-full opacity-5 pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* الأفاتار — الحرف الأول من fullName */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#A8C8E8] flex items-center justify-center text-[#0A2947] font-extrabold text-4xl shadow-xl shrink-0 select-none border-4 border-white/20">
              {profile ? getInitial(profile) : "م"}
            </div>

            <div className="text-center sm:text-right">
              {profile?.role && (
                <span className="bg-[#A8C8E8]/20 border border-[#A8C8E8]/40 text-[#A8C8E8] text-xs font-bold px-3 py-1 rounded-full">
                  {getRoleLabel(profile.role)}
                </span>
              )}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FFFAF3] mt-2">
                {profile ? getDisplayName(profile) : "—"}
              </h1>
              {profile?.userName && <p className="text-[#A8C8E8]/80 text-sm mt-1 font-mono">@{profile.userName}</p>}
              {profile?.createdAt && (
                <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-2 text-[#A8C8E8]/70 text-xs">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>عضو منذ {formatDate(profile.createdAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="relative z-10 flex flex-col sm:flex-row gap-3 mt-7 w-full sm:w-auto">
            <Link href="/teacher/profile/edit" className="flex items-center justify-center gap-2 bg-[#FFF2DB] text-[#0A2947] px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 w-full sm:w-auto text-center">
              <Pencil className="w-4 h-4" /> تعديل البيانات
            </Link>
          </div>
        </div>

        {/* ── بطاقات التفاصيل ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {profile?.userName     && <InfoCard C={C} icon={User}     label="اسم المستخدم"    value={`@${profile.userName}`}                       delay="0s"    />}
          {(profile?.fullName || profile?.name) && <InfoCard C={C} icon={User} label="الاسم الكامل" value={profile?.fullName || profile?.name || "—"} delay="0.05s" />}
          {profile?.email        && <InfoCard C={C} icon={Mail}     label="البريد الإلكتروني" value={profile.email}                                delay="0.1s"  ltr />}
          {(profile?.phoneNumber || profile?.phone) && <InfoCard C={C} icon={Phone} label="رقم الهاتف" value={profile?.phoneNumber || profile?.phone || "—"} delay="0.15s" ltr />}
          {profile?.role         && <InfoCard C={C} icon={Shield}   label="الدور الوظيفي"    value={getRoleLabel(profile.role)}                   delay="0.25s" />}
          {profile?.createdAt    && <InfoCard C={C} icon={Calendar} label="تاريخ الانضمام"   value={formatDate(profile.createdAt)}                delay="0.3s"  />}
        </div>
      </main>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   InfoCard — بطاقة عرض معلومة واحدة مع دعم الثيم
════════════════════════════════════════════════════════════════════════════ */
function InfoCard({ C, icon: Icon, label, value, delay = "0s", ltr = false }: {
  C: ThemeColors; icon: React.ElementType; label: string; value: string; delay?: string; ltr?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-5 flex items-start gap-4 transition-all duration-300 animate-[fadeUp_0.4s_ease-out_both] cursor-default"
      style={{ backgroundColor: C.card, border: `2px solid ${C.border}`, animationDelay: delay }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = C.borderA; el.style.boxShadow = C.cardHovSh; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = C.border;  el.style.boxShadow = "none"; }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: C.icon }}>
        <Icon className="w-5 h-5" style={{ color: C.textP }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold mb-1" style={{ color: C.textM }}>{label}</p>
        <p className="font-bold text-sm break-all" style={{ color: C.textP }} dir={ltr ? "ltr" : "rtl"}>{value || "—"}</p>
      </div>
    </div>
  );
}
