"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   src/app/student/level-time/page.tsx
   صفحة عرض الجدول الأسبوعي الثابت للطالب

   يعرض: اليوم من الأسبوع + الوقت فقط — بدون تاريخ أو تقويم
───────────────────────────────────────────────────────────────────────────── */

import {
  Clock, GraduationCap, ChevronLeft,
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
  getDayLabel,
  getDayOrder,
  formatTime12,
  sortLevelTimes,
} from "@/lib/api/levelTime";

/* ══ ترتيب الأيام للعرض في الجدول ══ */
const DAY_COLORS: Record<string, string> = {
  sunday:    "rgba(168,200,232,0.25)",
  monday:    "rgba(168,200,232,0.18)",
  tuesday:   "rgba(255,242,219,0.35)",
  wednesday: "rgba(168,200,232,0.25)",
  thursday:  "rgba(255,242,219,0.35)",
  friday:    "rgba(200,230,200,0.25)",
  saturday:  "rgba(220,200,240,0.25)",
};

export default function StudentLevelTimePage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);

  const [profile, setProfile]     = useState<UserProfile | null>(null);
  const [levelTimes, setLevelTimes] = useState<LevelTime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tr = "transition-all duration-300 ease-in-out";

  /* ── جلب البيانات عند التحميل ── */
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const userProfile = await getProfile();
      setProfile(userProfile);
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  const getInitial = () => {
    if (!profile) return "م";
    return (profile.fullName ?? profile.name ?? profile.userName ?? "م").charAt(0).toUpperCase();
  };

  const getFirstName = () => {
    if (!profile) return "";
    const name = profile.fullName ?? profile.name ?? profile.userName ?? "";
    return name.split(" ")[0];
  };

  /* ── الأوقات مرتبة حسب اليوم ثم الوقت ── */
  const sorted = sortLevelTimes(levelTimes);

  /* ── تجميع الأوقات حسب اليوم لعرض جدول أسبوعي ── */
  const groupedByDay = sorted.reduce((acc, t) => {
    if (!acc[t.day]) acc[t.day] = [];
    acc[t.day].push(t);
    return acc;
  }, {} as Record<string, LevelTime[]>);

  /* ── أيام لها حصص مرتبة حسب ترتيب الأسبوع ── */
  const daysWithClasses = Object.keys(groupedByDay).sort(
    (a, b) => getDayOrder(a) - getDayOrder(b)
  );

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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#0A2947] flex items-center justify-center shadow-md">
            <GraduationCap className="text-[#A8C8E8] w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight" style={{ color: C.textP }}>
            جدول الحصص الأسبوعي
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block"><ThemeToggle /></div>

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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* ── لافتة الترحيب ── */}
        <div
          className={`relative rounded-3xl p-7 sm:p-12 text-white mb-10 overflow-hidden shadow-2xl ${tr}`}
          style={{ backgroundColor: C.hero }}
        >
          <div className="relative z-10 max-w-2xl">
            <p className="text-[#A8C8E8] text-xs sm:text-sm font-semibold mb-2 tracking-widest uppercase">
              جدولك الأسبوعي الثابت
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 text-[#FFFAF3] leading-snug">
              أهلاً بك، {getFirstName()} 👋
            </h2>
            <p className="text-[#A8C8E8]/90 text-sm sm:text-base leading-relaxed">
              {profile?.level ? (
                <>
                  جدول حصصك الأسبوعي لمستوى:{" "}
                  <span className="font-extrabold text-[#FFF2DB]">{getLevelLabel(profile.level)}</span>
                </>
              ) : (
                "جدول حصصك الأسبوعي"
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
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#0A2947] border-t-transparent" />
            <p className="mt-4" style={{ color: C.textM }}>جاري التحميل...</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── لم يُحدَّد مستوى الطالب ── */}
            {!profile?.level ? (
              <div
                className="rounded-2xl p-12 text-center"
                style={{ backgroundColor: C.card, border: `2px solid ${C.border}` }}
              >
                <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: C.textM }} />
                <p className="text-lg font-semibold mb-2" style={{ color: C.textP }}>
                  لم يتم تحديد مستواك الدراسي
                </p>
                <p style={{ color: C.textS }}>يرجى التواصل مع الإدارة لتحديد مستواك الدراسي</p>
              </div>

            ) : sorted.length === 0 ? (
              /* ── لا توجد حصص ── */
              <div
                className="rounded-2xl p-12 text-center"
                style={{ backgroundColor: C.card, border: `2px solid ${C.border}` }}
              >
                <Clock className="w-16 h-16 mx-auto mb-4" style={{ color: C.textM }} />
                <p className="text-lg font-semibold mb-2" style={{ color: C.textP }}>
                  لا توجد حصص مسجلة
                </p>
                <p style={{ color: C.textS }}>لم يتم إضافة الجدول الأسبوعي لمستواك بعد</p>
              </div>

            ) : (
              <>
                {/* ════ الجدول الأسبوعي — بطاقة لكل يوم ════ */}
                <div className="space-y-4">
                  {daysWithClasses.map((day) => (
                    <div
                      key={day}
                      className={`rounded-2xl overflow-hidden shadow-sm ${tr}`}
                      style={{ border: `2px solid ${C.border}` }}
                    >
                      {/* رأس اليوم */}
                      <div
                        className="px-5 py-3 flex items-center gap-3"
                        style={{ backgroundColor: DAY_COLORS[day] ?? "rgba(168,200,232,0.2)" }}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm"
                          style={{ backgroundColor: "#0A2947", color: "#A8C8E8" }}
                        >
                          {getDayLabel(day).charAt(0)}
                        </div>
                        <h3 className="font-extrabold text-base" style={{ color: C.textP }}>
                          {getDayLabel(day)}
                        </h3>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "rgba(10,41,71,0.12)", color: "#0A2947" }}
                        >
                          {groupedByDay[day].length} حصة
                        </span>
                      </div>

                      {/* أوقات الحصص في هذا اليوم */}
                      <div
                        className="divide-y"
                        style={{ backgroundColor: C.card, borderColor: C.border }}
                      >
                        {groupedByDay[day].map((t, idx) => (
                          <div
                            key={t._id || t.id || idx}
                            className="px-5 py-4 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-4">
                              {/* أيقونة الوقت */}
                              <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: C.icon }}
                              >
                                <Clock className="w-5 h-5" style={{ color: "#0A2947" }} />
                              </div>

                              {/* الوقت — العرض الرئيسي */}
                              <div>
                                <span
                                  className="text-xl font-extrabold tracking-wide"
                                  style={{ color: "#0A2947" }}
                                >
                                  {formatTime12(t.time)}
                                </span>
                                {/* الوقت بصيغة 24 ساعة — صغيرة */}
                                <p className="text-xs mt-0.5" style={{ color: C.textM }}>
                                  {t.time}
                                </p>
                              </div>
                            </div>

                            {/* شارة "ثابت أسبوعياً" */}
                            <span
                              className="text-xs font-semibold px-3 py-1 rounded-full hidden sm:inline"
                              style={{ backgroundColor: "rgba(168,200,232,0.25)", color: "#0A2947" }}
                            >
                              أسبوعياً
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ════ ملاحظات هامة ════ */}
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
                      <h4 className="font-extrabold mb-2" style={{ color: C.textP }}>ملاحظات هامة</h4>
                      <ul className="space-y-1 text-sm" style={{ color: C.textS }}>
                        <li>• يرجى الحضور قبل وقت الحصة بـ 10 دقائق</li>
                        <li>• الجدول أسبوعي ثابت ويتكرر كل أسبوع</li>
                        <li>• أي تغيير في الجدول سيتم إبلاغكم مسبقاً</li>
                        <li>• في حال الغياب، يرجى إعلام المعلم مسبقاً</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
