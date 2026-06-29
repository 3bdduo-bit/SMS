"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   بوابة الطالب  /student

   - ديناميكية: تجلب اسم المستخدم الحقيقي من API
   - دعم كامل للوضع الليلي عبر useTheme Context
   - زر التبديل المتحرك في الـ navbar
   - Tailwind CSS + lucide-react + RTL
───────────────────────────────────────────────────────────────────────────── */

import {
  BookOpen, Calendar, FileText, User, GraduationCap,
  Settings, Bell, LogOut, ChevronLeft, CreditCard,
  LayoutDashboard, ClipboardList, MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getProfile, UserProfile } from "@/lib/api/user";
import { useTheme } from "@/components/ThemeProvider";
import { getColors } from "@/lib/theme/colors";
import ThemeToggle from "@/components/ThemeToggle";

/* ── بطاقات الوصول السريع ── */
const quickAccess = [
  { title: "لوحة التحكم",      desc: "نظرة عامة على نشاطاتك وإحصائياتك الدراسية.",          icon: LayoutDashboard, href: "#" },
  { title: "المقررات الدراسية", desc: "تصفّح جميع مقرراتك المسجّلة والمحتوى التعليمي.",      icon: BookOpen,        href: "#" },
  { title: "الجدول الدراسي",   desc: "اطّلع على مواعيد محاضراتك وامتحاناتك.",               icon: Calendar,        href: "#" },
  { title: "النتائج والدرجات", desc: "تابع درجاتك وأداءك في جميع المقررات.",                icon: FileText,        href: "#" },
  { title: "الواجبات",         desc: "استعرض الواجبات المطلوبة وسلّمها في الموعد.",          icon: ClipboardList,   href: "#" },
  { title: "المدفوعات",        desc: "تحقّق من حالة الرسوم الدراسية وسجل الدفع.",            icon: CreditCard,      href: "#" },
  { title: "الملف الشخصي",     desc: "عدّل بياناتك الشخصية وكلمة المرور.",                  icon: User,            href: "/student/profile" },
  { title: "الرسائل",          desc: "تواصل مع أساتذتك وإدارة الكلية مباشرةً.",             icon: MessageSquare,   href: "#" },
  { title: "الشهادات",         desc: "اطّلع على شهاداتك وأوراق التخرج الرسمية.",            icon: GraduationCap,   href: "#" },
  { title: "الإعدادات",        desc: "خصّص حسابك وإعدادات الإشعارات.",                      icon: Settings,        href: "#" },
];

/* ════════════════════════════════════════════════════════════════════════════
   المكوّن الرئيسي
════════════════════════════════════════════════════════════════════════════ */
export default function StudentPage() {
  const router             = useRouter();
  const { isDark }         = useTheme();          /* ← يُعيد الرسم عند تغيير الثيم */
  const C                  = getColors(isDark);   /* ← ألوان الثيم الحالي */
  const [profile, setProfile] = useState<UserProfile | null>(null);

  /* ── جلب بيانات المستخدم عند تحميل الصفحة ── */
  useEffect(() => {
    getProfile()
      .then(data => setProfile(data))
      .catch(err => console.error("Failed to fetch profile:", err));
  }, []);

  /* ── تسجيل الخروج ── */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  /* ── الحرف الأول من الاسم الكامل للأفاتار ── */
  const getInitial = () => {
    if (!profile) return "؟";
    return (profile.fullName || profile.name || profile.userName || "؟").charAt(0).toUpperCase();
  };

  /* ── اسم الترحيب ── */
  const getFirstName = () => {
    if (!profile) return "";
    const name = profile.fullName || profile.name || profile.userName || "";
    return `يا ${name.split(" ")[0]}`;
  };

  /* ────── transition مشترك لكل العناصر ────── */
  const tr = "transition-all duration-300 ease-in-out";

  return (
    <div className={`min-h-[100dvh] ${tr}`} style={{ backgroundColor: C.page, color: C.textP }} dir="rtl">

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
            بوابة الطالب
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
            className="relative p-2 rounded-full hover:bg-[#A8C8E8]/20 transition-colors"
            style={{ color: C.textP }}
            aria-label="الإشعارات"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>

          {/* أفاتار الطالب — الحرف الأول من الاسم الكامل */}
          <Link href="/student/profile">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#A8C8E8] flex items-center justify-center text-[#0A2947] font-extrabold text-sm shadow-inner select-none cursor-pointer hover:ring-2 hover:ring-[#0A2947] transition-all"
              title="الملف الشخصي"
            >
              {getInitial()}
            </div>
          </Link>

          {/* زر الخروج */}
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1.5 text-red-500 hover:text-red-700 font-semibold text-sm transition-colors px-3 py-2 rounded-xl hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            خروج
          </button>
        </div>
      </nav>

      {/* ════════════ المحتوى الرئيسي ════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-28 sm:pb-12">

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
              مرحباً بك {getFirstName()} 🎓
            </h2>
            <p className="text-[#A8C8E8]/90 text-sm sm:text-base mb-7 leading-relaxed">
              تابع مقرراتك، واطّلع على جدولك الدراسي، وراجع درجاتك — كل ذلك في مكان واحد.
            </p>
            <Link href="/student/profile">
              <button className="bg-[#FFF2DB] text-[#0A2947] px-7 py-3 rounded-xl font-extrabold hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-sm sm:text-base cursor-pointer">
                عرض ملفي الشخصي
              </button>
            </Link>
          </div>
          {/* دوائر زخرفية */}
          <div className="absolute -left-16 -top-16 w-72 h-72 bg-[#A8C8E8] rounded-full opacity-10 pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#FFF2DB] rounded-full opacity-5 pointer-events-none" />
        </div>

        {/* ── عنوان الشبكة ── */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl sm:text-2xl font-extrabold" style={{ color: C.textP }}>الوصول السريع</h3>
          <span className="text-xs" style={{ color: C.textM }}>{quickAccess.length} خدمة</span>
        </div>

        {/* ── شبكة البطاقات ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {quickAccess.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link key={i} href={item.href} className="group block" style={{ animationDelay: `${i * 0.05}s` }}>
                <div
                  className={`rounded-2xl p-5 h-full flex flex-col gap-3 ${tr} animate-[fadeUp_0.45s_ease-out_both] group-hover:-translate-y-1`}
                  style={{
                    backgroundColor: C.card,
                    border: `2px solid ${C.border}`,
                    boxShadow: C.cardSh,
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = C.borderA;
                    el.style.boxShadow   = C.cardHovSh;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = C.border;
                    el.style.boxShadow   = C.cardSh;
                  }}
                >
                  {/* رأس البطاقة */}
                  <div className="flex items-start justify-between">
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: C.icon }}
                    >
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: C.textP }} />
                    </div>
                    <ChevronLeft className="w-5 h-5 mt-1 transition-colors group-hover:text-[#A8C8E8]" style={{ color: C.textM }} />
                  </div>
                  {/* نص البطاقة */}
                  <div>
                    <h4 className="text-base font-extrabold mb-1" style={{ color: C.textP }}>{item.title}</h4>
                    <p className="text-xs sm:text-sm leading-relaxed" style={{ color: C.textS }}>{item.desc}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      {/* ════════════ شريط التنقل السفلي (موبايل) ════════════ */}
      <div
        className={`sm:hidden fixed bottom-0 left-0 right-0 px-6 py-3 flex justify-around items-center z-50 ${tr}`}
        style={{ backgroundColor: C.nav, borderTop: `1px solid ${C.border}` }}
      >
        <Link href="#" className="flex flex-col items-center gap-0.5" style={{ color: C.textP }}>
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[9px] font-bold">الرئيسية</span>
        </Link>
        <Link href="#" className="flex flex-col items-center gap-0.5 transition-colors" style={{ color: C.textM }}>
          <BookOpen className="w-6 h-6" />
          <span className="text-[9px] font-bold">مقرراتي</span>
        </Link>
        <ThemeToggle />
        <Link
          href="/student/profile"
          className="flex flex-col items-center gap-0.5 transition-colors"
          style={{ color: C.textM }}
        >
          <User className="w-6 h-6" />
          <span className="text-[9px] font-bold">حسابي</span>
        </Link>
      </div>
    </div>
  );
}
