"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   src/app/student/level-time/page.tsx
   صفحة عرض أوقات المستوى الدراسي للطالب

   الميزات:
   - عرض أوقات الحصص الخاصة بمستوى الطالب فقط
   - عرض الجدول الأسبوعي بشكل منظم باستخدام ISO datetime
   - دعم الوضع الليلي + RTL + اللغة العربية
───────────────────────────────────────────────────────────────────────────── */

import {
  Clock, GraduationCap, Calendar, ChevronLeft,
  BookOpen, X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { getColors } from "@/lib/theme/colors";
import ThemeToggle from "@/components/ThemeToggle";
import { getProfile, UserProfile } from "@/lib/api/user";
import {
  getLevelTimeByLevel,
  LevelTime,
  getLevelLabel,
  getDayFromTime,
  getFormattedDate,
  getFormattedTime12
} from "@/lib/api/levelTime";

/* ════════════════════════════════════════════════════════════════════════════
   المكوّن الرئيسي
════════════════════════════════════════════════════════════════════════════ */
export default function StudentLevelTimePage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [levelTimes, setLevelTimes] = useState<LevelTime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /* ── transition مشترك ── */
  const tr = "transition-all duration-300 ease-in-out";

  /* ── جلب البيانات عند التحميل ── */
  useEffect(() => {
    loadData();
  }, []);

  /* ── جلب بيانات الطالب وأوقات مستواه ── */
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // جلب بيانات الطالب
      const userProfile = await getProfile();
      setProfile(userProfile);
      
      // جلب أوقات المستوى
      if (userProfile.level) {
        const times = await getLevelTimeByLevel(userProfile.level);
        setLevelTimes(times);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── تسجيل الخروج ── */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  /* ── الحرف الأول للأفاتار ── */
  const getInitial = () => {
    if (!profile) return "م";
    return (profile.fullName ?? profile.name ?? profile.userName ?? "م").charAt(0).toUpperCase();
  };

  /* ── اسم الترحيب ── */
  const getFirstName = () => {
    if (!profile) return "";
    const name = profile.fullName ?? profile.name ?? profile.userName ?? "";
    return name.split(" ")[0];
  };

  /* ── ترتيب الأوقات حسب التاريخ ── */
  const sortedTimes = [...levelTimes].sort((a, b) => {
    return new Date(a.time).getTime() - new Date(b.time).getTime();
  });

  return (
    <div
      className={`min-h-[100dvh] ${tr}`}
      style={{ backgroundColor: C.page, color: C.textP }}
      dir="rtl"
    >
      {/* ════════════ شريط التنقل العلوي ════════════ */}
      <nav
        className={`px-4 sm:px-8 py-3 flex justify-between items-center sticky top-0 z-50 ${tr}`}
        style={{ backgroundColor: C.nav, borderBottom: `1px solid ${C.border}`, boxShadow: C.navShadow }}
      >
        {/* الشعار */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#0A2947] flex items-center justify-center shadow-md">
            <GraduationCap className="text-[#A8C8E8] w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight" style={{ color: C.textP }}>
            جدول الحصص
          </h1>
        </div>

        {/* أيقونات اليمين */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* أفاتار الطالب */}
          <div
            className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#A8C8E8] items-center justify-center text-[#0A2947] font-extrabold text-sm shadow-inner select-none"
            title="الملف الشخصي"
          >
            {getInitial()}
          </div>

          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1.5 text-red-500 hover:text-red-700 font-semibold text-sm transition-colors px-3 py-2 rounded-xl hover:bg-red-50"
          >
            خروج
          </button>

          <button
            className="sm:hidden p-2 rounded-xl hover:bg-black/5 transition-colors"
            style={{ color: C.textP }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* ════════════ القائمة المنسدلة للموبايل ════════════ */}
      {isMobileMenuOpen && (
        <div
          className="sm:hidden absolute left-0 right-0 top-[65px] z-40 p-4 border-b shadow-lg"
          style={{ backgroundColor: C.nav, borderColor: C.border }}
        >
          <Link
            href="/student"
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-black/5 mb-3"
            style={{ color: C.textP }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-semibold text-sm">العودة للرئيسية</span>
          </Link>
          <button
            onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-red-50 text-red-500 font-semibold text-sm w-full"
          >
            تسجيل الخروج
          </button>
        </div>
      )}

      {/* ════════════ المحتوى الرئيسي ════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* ── لافتة الترحيب ── */}
        <div
          className={`relative rounded-3xl p-7 sm:p-12 text-white mb-10 overflow-hidden shadow-2xl ${tr}`}
          style={{ backgroundColor: C.hero }}
        >
          <div className="relative z-10 max-w-2xl">
            <p className="text-[#A8C8E8] text-xs sm:text-sm font-semibold mb-2 tracking-widest uppercase">
              جدولك الدراسي
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 text-[#FFFAF3] leading-snug">
              أهلاً بك، {getFirstName()} 👋
            </h2>
            <p className="text-[#A8C8E8]/90 text-sm sm:text-base mb-7 leading-relaxed">
              {profile?.level ? (
                <>
                  جدول حصصك لمستوى: <span className="font-extrabold text-[#FFF2DB]">{getLevelLabel(profile.level)}</span>
                </>
              ) : (
                "جدول حصصك الدراسي"
              )}
            </p>
          </div>

          {/* دوائر زخرفية */}
          <div className="absolute -left-16 -top-16 w-72 h-72 bg-[#A8C8E8] rounded-full opacity-10 pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#FFF2DB] rounded-full opacity-5 pointer-events-none" />
        </div>

        {/* ── حالة التحميل ── */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#0A2947] border-t-transparent"></div>
            <p className="mt-4" style={{ color: C.textM }}>جاري التحميل...</p>
          </div>
        ) : (
          /* ── عرض جدول الحصص ── */
          <div className="space-y-6">
            {!profile?.level ? (
              <div
                className="rounded-2xl p-12 text-center"
                style={{ backgroundColor: C.card, border: `2px solid ${C.border}` }}
              >
                <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: C.textM }} />
                <p className="text-lg font-semibold mb-2" style={{ color: C.textP }}>
                  لم يتم تحديد مستواك الدراسي
                </p>
                <p style={{ color: C.textS }}>
                  يرجى التواصل مع الإدارة لتحديد مستواك الدراسي
                </p>
              </div>
            ) : sortedTimes.length === 0 ? (
              <div
                className="rounded-2xl p-12 text-center"
                style={{ backgroundColor: C.card, border: `2px solid ${C.border}` }}
              >
                <Clock className="w-16 h-16 mx-auto mb-4" style={{ color: C.textM }} />
                <p className="text-lg font-semibold mb-2" style={{ color: C.textP }}>
                  لا توجد حصص مسجلة
                </p>
                <p style={{ color: C.textS }}>
                  لم يتم إضافة أوقات الحصص لمستواك الدراسي بعد
                </p>
              </div>
            ) : (
              <div
                className={`rounded-2xl overflow-hidden shadow-lg ${tr}`}
                style={{ backgroundColor: C.card, border: `2px solid ${C.border}` }}
              >
                {/* رأس الجدول */}
                <div
                  className="px-6 py-4 flex items-center gap-3"
                  style={{ backgroundColor: "#0A2947" }}
                >
                  <Calendar className="w-5 h-5 text-[#A8C8E8]" />
                  <h3 className="text-lg font-extrabold text-[#FFFAF3]">
                    جدول الحصص القادمة
                  </h3>
                  <span className="bg-[#A8C8E8]/20 text-[#A8C8E8] text-xs font-extrabold px-3 py-1 rounded-full">
                    {sortedTimes.length} حصة
                  </span>
                </div>

                {/* قائمة الحصص */}
                <div className="divide-y" style={{ borderColor: C.border }}>
                  {sortedTimes.map((time, index) => {
                    const isFuture = new Date(time.time).getTime() > Date.now();
                    return (
                    <div
                      key={time._id || time.id || index}
                      className="px-6 py-5 flex items-center justify-between hover:bg-black/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center"
                          style={{ backgroundColor: C.icon }}
                        >
                          <Clock className="w-6 h-6" style={{ color: C.textP }} />
                        </div>
                        <div>
                          <p className="font-extrabold text-lg mb-1" style={{ color: C.textP }}>
                            {getDayFromTime(time.time)} — {getFormattedDate(time.time)}
                          </p>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm font-semibold px-3 py-1 rounded-full"
                              style={{ 
                                backgroundColor: "rgba(168,200,232,0.2)", 
                                color: "#0A2947" 
                              }}
                            >
                              {getFormattedTime12(time.time)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* مؤشر الحصة (قادمة أو سابقة) */}
                      <div
                        className={`w-3 h-3 rounded-full shadow-lg ${
                          isFuture 
                            ? "bg-green-500 shadow-green-500/50" 
                            : "bg-gray-400 shadow-gray-400/50"
                        }`}
                        title={isFuture ? "حصة قادمة" : "حصة منتهية"}
                      />
                    </div>
                  );
                  })}
                </div>
              </div>
            )}

            {/* ── معلومات إضافية ── */}
            {sortedTimes.length > 0 && (
              <div
                className={`rounded-2xl p-6 ${tr}`}
                style={{ backgroundColor: C.card, border: `2px solid ${C.border}` }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(168,200,232,0.2)" }}
                  >
                    <BookOpen className="w-5 h-5 text-[#0A2947]" />
                  </div>
                  <div>
                    <h4 className="font-extrabold mb-2" style={{ color: C.textP }}>
                      ملاحظات هامة
                    </h4>
                    <ul className="space-y-1 text-sm" style={{ color: C.textS }}>
                      <li>• يرجى الحضور قبل وقت الحصة بـ 10 دقائق</li>
                      <li>• أي تغيير في الجدول سيتم إبلاغكم مسبقاً</li>
                      <li>• في حال الغياب، يرجى إعلام المعلم مسبقاً</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
