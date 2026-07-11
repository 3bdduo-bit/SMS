"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   src/app/student/attendance/page.tsx
   صفحة سجل الحضور — خاصة بالطالب

   الميزات:
   - عرض سجل حضور الطالب
   - عرض الإحصائيات (أيام الحضور، الغياب، التأخر)
   - دعم الوضع الليلي + RTL + اللغة العربية
───────────────────────────────────────────────────────────────────────────── */

import {
  GraduationCap, LogOut, ChevronLeft, AlertCircle, Loader2,
  Menu, X, CheckCircle2, XCircle, Clock, AlertTriangle, Calendar
, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { getProfile, UserProfile } from "@/lib/api/user";
import { getStudentAttendance, AttendanceRecord } from "@/lib/api/attendance";
import { useTheme } from "@/components/ThemeProvider";
import { getColors } from "@/lib/theme/colors";
import ThemeToggle from "@/components/ThemeToggle";

const ATTENDANCE_STATUS = [
  { value: "present", label: "حاضر", icon: CheckCircle2, color: "#16a34a", bg: "rgba(34,197,94,0.12)" },
  { value: "absent", label: "غائب", icon: XCircle, color: "#dc2626", bg: "rgba(239,68,68,0.12)" },
  { value: "late", label: "متأخر", icon: Clock, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  { value: "excused", label: "معذور", icon: AlertTriangle, color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
] as const;

export default function StudentAttendancePage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tr = "transition-all duration-300 ease-in-out";

  useEffect(() => {
    getProfile().then(p => setProfile(p)).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getStudentAttendance();
        setAttendance(data);
      } catch (err) {
        setError((err as Error).message || "فشل في تحميل سجل الحضور.");
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  const stats = useMemo(() => {
    const present = attendance.filter(r => r.status === "present").length;
    const absent = attendance.filter(r => r.status === "absent").length;
    const late = attendance.filter(r => r.status === "late").length;
    const excused = attendance.filter(r => r.status === "excused").length;
    const total = attendance.length;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, late, excused, total, attendanceRate };
  }, [attendance]);

  const getStatusBadge = (status?: string) => {
    const option = ATTENDANCE_STATUS.find(s => s.value === status);
    if (!option) return { text: "غير مسجل", bg: "rgba(156,163,175,0.12)", col: "#6b7280", border: "rgba(156,163,175,0.4)" };
    return { text: option.label, bg: option.bg, col: option.color, border: option.color + "66" };
  };

  const formatDate = (d?: string) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("ar-EG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch {
      return d;
    }
  };

  const sortedAttendance = useMemo(() => {
    return [...attendance].sort((a, b) => {
      const dateA = new Date(a.date || "");
      const dateB = new Date(b.date || "");
      return dateB.getTime() - dateA.getTime();
    });
  }, [attendance]);

  return (
    <div
      className={`min-h-[100dvh] ${tr}`}
      style={{ backgroundColor: C.page, color: C.textP }}
      dir="rtl"
    >
      <nav
        className={`px-4 sm:px-8 py-3 flex justify-between items-center sticky top-0 z-50 ${tr}`}
        style={{ backgroundColor: C.nav, borderBottom: `1px solid ${C.border}`, boxShadow: C.navShadow }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/student"
            className="p-2 rounded-xl hover:bg-black/5 transition-colors group flex items-center justify-center"
            title="العودة للرئيسية"
          >
            <Home className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" style={{ color: C.textP }} />
          </Link>
          <Link href="/student" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#0A2947] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <CheckCircle2 className="text-[#A8C8E8] w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight leading-none" style={{ color: C.textP }}>
              بوابة الطالب
            </h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: C.textM }}>
              سجل الحضور
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          <Link
            href="/student"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-all hover:-translate-y-0.5"
            style={{ color: C.textS, backgroundColor: C.icon }}
          >
            <GraduationCap className="w-4 h-4" />
            لوحة التحكم
          </Link>

          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1.5 text-red-500 hover:text-red-700 font-semibold text-sm transition-colors px-3 py-2 rounded-xl hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            خروج
          </button>

          <button
            className="sm:hidden p-2 rounded-xl hover:bg-black/5 transition-colors"
            style={{ color: C.textP }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div
          className="sm:hidden absolute left-0 right-0 top-[65px] z-40 p-4 border-b shadow-lg"
          style={{ backgroundColor: C.nav, borderColor: C.border }}
        >
          <div className="flex flex-col gap-3">
            <Link
              href="/student"
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-black/5"
              style={{ color: C.textP }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <GraduationCap className="w-5 h-5" />
              <span className="font-semibold text-sm">لوحة التحكم</span>
            </Link>
            <div className="flex items-center gap-3 p-2 rounded-xl" style={{ color: C.textP }}>
              <span className="font-semibold text-sm flex-1">المظهر</span>
              <ThemeToggle />
            </div>
            <button
              onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-red-50 text-red-500 font-semibold text-sm w-full"
            >
              <LogOut className="w-5 h-5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        <div
          className={`relative rounded-3xl p-6 sm:p-10 text-white mb-8 overflow-hidden shadow-2xl animate-[fadeUp_0.4s_ease-out_both] ${tr}`}
          style={{ backgroundColor: C.hero }}
        >
          <div className="relative z-10">
            <p className="text-[#A8C8E8] text-xs sm:text-sm font-semibold mb-2 tracking-widest uppercase">
              منصة SMS التعليمية — قسم الحضور
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 text-[#FFFAF3]">
              سجل الحضور الخاص بك 📊
            </h2>
            <p className="text-[#A8C8E8]/90 text-sm mb-4">
              تابع سجل حضورك واطلع على إحصائياتك الدراسية.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#A8C8E8]" />
                <span className="text-white font-bold text-sm">{stats.attendanceRate}% نسبة الحضور</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#A8C8E8]" />
                <span className="text-white font-bold text-sm">{stats.total} يوم مسجل</span>
              </div>
            </div>
          </div>
          <div className="absolute -left-16 -top-16 w-72 h-72 bg-[#A8C8E8] rounded-full opacity-10 pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#FFF2DB] rounded-full opacity-5 pointer-events-none" />
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 animate-[fadeUp_0.45s_ease-out_both]">
          <div className="rounded-2xl p-4" style={{ backgroundColor: C.card, border: `2px solid ${C.border}`, boxShadow: C.cardSh }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5" style={{ color: "#16a34a" }} />
              <span className="text-xs font-semibold" style={{ color: C.textM }}>حاضر</span>
            </div>
            <p className="text-2xl font-extrabold" style={{ color: "#16a34a" }}>{stats.present}</p>
          </div>
          <div className="rounded-2xl p-4" style={{ backgroundColor: C.card, border: `2px solid ${C.border}`, boxShadow: C.cardSh }}>
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5" style={{ color: "#dc2626" }} />
              <span className="text-xs font-semibold" style={{ color: C.textM }}>غائب</span>
            </div>
            <p className="text-2xl font-extrabold" style={{ color: "#dc2626" }}>{stats.absent}</p>
          </div>
          <div className="rounded-2xl p-4" style={{ backgroundColor: C.card, border: `2px solid ${C.border}`, boxShadow: C.cardSh }}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5" style={{ color: "#f59e0b" }} />
              <span className="text-xs font-semibold" style={{ color: C.textM }}>متأخر</span>
            </div>
            <p className="text-2xl font-extrabold" style={{ color: "#f59e0b" }}>{stats.late}</p>
          </div>
          <div className="rounded-2xl p-4" style={{ backgroundColor: C.card, border: `2px solid ${C.border}`, boxShadow: C.cardSh }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" style={{ color: "#3b82f6" }} />
              <span className="text-xs font-semibold" style={{ color: C.textM }}>معذور</span>
            </div>
            <p className="text-2xl font-extrabold" style={{ color: "#3b82f6" }}>{stats.excused}</p>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 animate-[fadeUp_0.4s_ease-out_both]">
            <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: "#A8C8E8" }} />
            <p className="text-lg font-semibold" style={{ color: C.textM }}>جاري تحميل سجل الحضور...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl p-5 mb-6 flex items-start gap-3 animate-[fadeUp_0.4s_ease-out_both]" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "2px solid rgba(239,68,68,0.25)" }}>
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-red-600 text-sm mb-1">حدث خطأ</p>
              <p className="text-red-500/80 text-xs">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && sortedAttendance.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 animate-[fadeUp_0.4s_ease-out_both]">
            <CheckCircle2 className="w-16 h-16 mb-4 opacity-20" style={{ color: C.textM }} />
            <p className="text-lg font-bold mb-1" style={{ color: C.textS }}>لا يوجد سجل حضور</p>
            <p className="text-sm" style={{ color: C.textM }}>سيظهر سجل حضورك هنا بعد تسجيله من قبل المعلم.</p>
          </div>
        )}

        {!loading && !error && sortedAttendance.length > 0 && (
          <>
            <div className="hidden md:block rounded-3xl overflow-hidden shadow-xl animate-[fadeUp_0.5s_ease-out_both]" style={{ border: `2px solid ${C.border}` }}>
              <div className="grid grid-cols-[3rem_2fr_1fr_8rem] gap-4 px-6 py-4 text-xs font-extrabold tracking-widest uppercase" style={{ backgroundColor: "#0A2947", color: "#A8C8E8" }}>
                <span>#</span>
                <span>التاريخ</span>
                <span>الحالة</span>
                <span className="text-center">ملاحظات</span>
              </div>

              {sortedAttendance.map((record, idx) => {
                const badge = getStatusBadge(record.status);

                return (
                  <div key={record.id || record._id || idx} className={`grid grid-cols-[3rem_2fr_1fr_8rem] gap-4 px-6 py-4 items-center ${tr} border-b last:border-b-0`} style={{ backgroundColor: C.card, borderColor: C.border }}>
                    <span className="text-sm font-bold" style={{ color: C.textM }}>{idx + 1}</span>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" style={{ color: C.textM }} />
                      <span className="font-bold text-sm" style={{ color: C.textP }}>{formatDate(record.date)}</span>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ backgroundColor: badge.bg, color: badge.col, border: `1.5px solid ${badge.border}` }}>
                      {badge.text}
                    </span>

                    <span className="text-sm text-center" style={{ color: C.textS }}>
                      {record.notes || "—"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="md:hidden flex flex-col gap-4 animate-[fadeUp_0.5s_ease-out_both]">
              {sortedAttendance.map((record, idx) => {
                const badge = getStatusBadge(record.status);

                return (
                  <div key={record.id || record._id || idx} className={`rounded-2xl p-5 ${tr}`} style={{ backgroundColor: C.card, border: `2px solid ${C.border}`, boxShadow: C.cardSh }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" style={{ color: C.textM }} />
                        <span className="font-bold text-sm" style={{ color: C.textP }}>{formatDate(record.date)}</span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ backgroundColor: badge.bg, color: badge.col, border: `1.5px solid ${badge.border}` }}>
                        {badge.text}
                      </span>
                    </div>

                    {record.notes && (
                      <div className="bg-black/5 rounded-xl p-3" style={{ backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.03)" }}>
                        <p className="text-xs" style={{ color: C.textS }}>{record.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-center text-xs mt-6" style={{ color: C.textM }}>
              إجمالي <strong>{sortedAttendance.length}</strong> سجل حضور
            </p>
          </>
        )}
      </main>
    </div>
  );
}
