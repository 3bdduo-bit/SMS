"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   src/app/teacher/page.tsx
   لوحة تحكم المعلم

   الميزات:
   - ترحيب بالمعلم مع اسمه من الـ API
   - بطاقات وصول سريع لصفحات المعلم
   - بطاقة إدارة الطلاب تعرض عدد الطلاب المسجّلين
   - دعم الوضع الليلي + RTL + اللغة العربية
───────────────────────────────────────────────────────────────────────────── */

import {
  GraduationCap, Users, BookOpen, Calendar,
  ClipboardList, MessageSquare, Settings, LogOut,
  ChevronLeft, Bell, Menu, X, LayoutDashboard, CreditCard, Clock, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getProfile, UserProfile } from "@/lib/api/user";
import { getStudents } from "@/lib/api/students";
import { useTheme } from "@/components/ThemeProvider";
import { getColors } from "@/lib/theme/colors";
import ThemeToggle from "@/components/ThemeToggle";

/* ── بطاقات الوصول السريع للمعلم ── */
const quickAccess = [
  {
    title: "إدارة الطلاب",
    desc: "اعرض قائمة الطلاب المسجّلين وحدّث مستوياتهم الدراسية.",
    icon: Users,
    href: "/teacher/students",
    highlight: true, /* بطاقة مميّزة */
    countKey: "students" as const,
  },
  {
    title: "تسجيل الحضور",
    desc: "سجل حضور الطلاب لكل يوم وتابع سجل الحضور.",
    icon: CheckCircle2,
    href: "/teacher/attendance",
    highlight: false,
    countKey: null,
  },
  {
    title: "إدارة الكتب",
    desc: "أضف كتباً ومصغرات لكل مستوى دراسي.",
    icon: BookOpen,
    href: "/teacher/books",
    highlight: false,
    countKey: null,
  },
  {
    title: "أوقات المستويات",
    desc: "أدِر أوقات الحصص لكل مستوى دراسي وأضف أوقات جديدة.",
    icon: Clock,
    href: "/teacher/level-time",
    highlight: false,
    countKey: null,
  },
  {
    title: "الاختبارات",
    desc: "أنشئ اختبارات متعددة الخيارات لأي مستوى دراسي واحتفظ بها.",
    icon: ClipboardList,
    href: "/teacher/exams",
    highlight: false,
    countKey: null,
  },
  {
    title: "المدفوعات",
    desc: "تحقق من حالة الرسوم الدراسية وسجل الدفع.",
    icon: CreditCard,
    href: "/teacher/payments",
    highlight: false,
    countKey: null,
  },
  {
    title: "الإعدادات (الملف الشخصي)",
    desc: "إدارة إعدادات حسابك وتفضيلاتك الشخصية.",
    icon: Settings,
    href: "/teacher/profile",
    highlight: false,
    countKey: null,
  },
];

/* ════════════════════════════════════════════════════════════════════════════
   المكوّن الرئيسي
════════════════════════════════════════════════════════════════════════════ */
export default function TeacherPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /* ── transition مشترك ── */
  const tr = "transition-all duration-300 ease-in-out";

  /* ── جلب البيانات عند التحميل ── */
  useEffect(() => {
    /* جلب الملف الشخصي */
    getProfile()
      .then(data => setProfile(data))
      .catch(err => console.error("Failed to fetch profile:", err));

    /* جلب عدد الطلاب لعرضه في البطاقة */
    getStudents()
      .then(data => setStudentCount(data.length))
      .catch(() => setStudentCount(null));
  }, []);

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
    return `أستاذ ${name.split(" ")[0]}`;
  };

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
            بوابة المعلم
          </h1>
        </div>

        {/* أيقونات اليمين */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* زر تبديل الثيم */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* جرس الإشعارات */}
          <button
            className="hidden sm:block relative p-2 rounded-full hover:bg-[#A8C8E8]/20 transition-colors"
            style={{ color: C.textP }}
            aria-label="الإشعارات"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>

          {/* أفاتار المعلم */}
          <div
            className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#A8C8E8] items-center justify-center text-[#0A2947] font-extrabold text-sm shadow-inner select-none"
            title="الملف الشخصي"
          >
            {getInitial()}
          </div>

          {/* زر الخروج */}
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1.5 text-red-500 hover:text-red-700 font-semibold text-sm transition-colors px-3 py-2 rounded-xl hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            خروج
          </button>

          {/* القائمة الجانبية للموبايل */}
          <button
            className="sm:hidden p-2 rounded-xl hover:bg-black/5 transition-colors"
            style={{ color: C.textP }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* ════════════ القائمة المنسدلة للموبايل ════════════ */}
      {isMobileMenuOpen && (
        <div
          className="sm:hidden absolute left-0 right-0 top-[65px] z-40 p-4 border-b shadow-lg animate-[fadeUp_0.2s_ease-out_both]"
          style={{ backgroundColor: C.nav, borderColor: C.border }}
        >
          <div className="flex flex-col gap-4">
            <Link
              href="#"
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-black/5"
              style={{ color: C.textP }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-semibold text-sm">الرئيسية</span>
            </Link>
            <Link
              href="/teacher/students"
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-black/5"
              style={{ color: C.textP }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Users className="w-5 h-5" />
              <span className="font-semibold text-sm">إدارة الطلاب</span>
            </Link>
            <Link
              href="/teacher/level-time"
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-black/5"
              style={{ color: C.textP }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Clock className="w-5 h-5" />
              <span className="font-semibold text-sm">أوقات المستويات</span>
            </Link>
            <div className="flex items-center gap-3 p-2 rounded-xl" style={{ color: C.textP }}>
              <span className="font-semibold text-sm flex-1">المظهر</span>
              <ThemeToggle />
            </div>
            <button
              onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-red-50 text-red-500 font-semibold text-sm text-right w-full"
            >
              <LogOut className="w-5 h-5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      )}

      {/* ════════════ المحتوى الرئيسي ════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* ── لافتة الترحيب ── */}
        <div
          className={`relative rounded-3xl p-7 sm:p-12 text-white mb-10 overflow-hidden shadow-2xl animate-[fadeUp_0.4s_ease-out_both] ${tr}`}
          style={{ backgroundColor: C.hero }}
        >
          <div className="relative z-10 max-w-2xl">
            <p className="text-[#A8C8E8] text-xs sm:text-sm font-semibold mb-2 tracking-widest uppercase">
              منصة SMS التعليمية
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 text-[#FFFAF3] leading-snug">
              مرحباً {getFirstName()} 🎓
            </h2>
            <p className="text-[#A8C8E8]/90 text-sm sm:text-base mb-7 leading-relaxed">
              أدِر طلابك، وحدّث مستوياتهم الدراسية، وتابع مقرراتك — كل ذلك في مكان واحد.
            </p>
            {/* رابط سريع لأبرز صفحة */}
            <Link href="/teacher/students">
              <button className="bg-[#FFF2DB] text-[#0A2947] px-7 py-3 rounded-xl font-extrabold hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-sm sm:text-base cursor-pointer flex items-center gap-2">
                <Users className="w-4 h-4" />
                إدارة الطلاب
                {studentCount !== null && (
                  <span className="bg-[#0A2947] text-[#A8C8E8] text-xs font-extrabold px-2 py-0.5 rounded-full">
                    {studentCount}
                  </span>
                )}
              </button>
            </Link>
          </div>

          {/* دوائر زخرفية */}
          <div className="absolute -left-16 -top-16 w-72 h-72 bg-[#A8C8E8] rounded-full opacity-10 pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#FFF2DB] rounded-full opacity-5 pointer-events-none" />
        </div>

        {/* ── عنوان الشبكة ── */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl sm:text-2xl font-extrabold" style={{ color: C.textP }}>
            الوصول السريع
          </h3>
          <span className="text-xs" style={{ color: C.textM }}>
            {quickAccess.length} خدمة
          </span>
        </div>

        {/* ── شبكة البطاقات ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {quickAccess.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link
                key={i}
                href={item.href}
                className="group block"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div
                  className={`rounded-2xl p-5 h-full flex flex-col gap-3 transition-all duration-300 animate-[fadeUp_0.45s_ease-out_both] group-hover:-translate-y-1`}
                  style={{
                    backgroundColor: item.highlight ? "#0A2947" : C.card,
                    border: `2px solid ${item.highlight ? "#0A2947" : C.border}`,
                    boxShadow: C.cardSh,
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = item.highlight ? "#A8C8E8" : C.borderA;
                    el.style.boxShadow   = C.cardHovSh;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = item.highlight ? "#0A2947" : C.border;
                    el.style.boxShadow   = C.cardSh;
                  }}
                >
                  {/* رأس البطاقة */}
                  <div className="flex items-start justify-between">
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{
                        backgroundColor: item.highlight ? "rgba(168,200,232,0.2)" : C.icon,
                      }}
                    >
                      <Icon
                        className="w-6 h-6 sm:w-7 sm:h-7"
                        style={{ color: item.highlight ? "#A8C8E8" : C.textP }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {/* عداد الطلاب على البطاقة المميّزة */}
                      {item.countKey === "students" && studentCount !== null && (
                        <span
                          className="text-xs font-extrabold px-2 py-1 rounded-full"
                          style={{ backgroundColor: "rgba(168,200,232,0.2)", color: "#A8C8E8" }}
                        >
                          {studentCount} طالب
                        </span>
                      )}
                      <ChevronLeft
                        className="w-5 h-5 mt-1 transition-colors group-hover:text-[#A8C8E8]"
                        style={{ color: item.highlight ? "#A8C8E8" : C.textM }}
                      />
                    </div>
                  </div>

                  {/* نص البطاقة */}
                  <div>
                    <h4
                      className="text-base font-extrabold mb-1"
                      style={{ color: item.highlight ? "#FFFAF3" : C.textP }}
                    >
                      {item.title}
                    </h4>
                    <p
                      className="text-xs sm:text-sm leading-relaxed"
                      style={{ color: item.highlight ? "#A8C8E8" : C.textS }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
