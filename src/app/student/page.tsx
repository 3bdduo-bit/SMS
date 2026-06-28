"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   بوابة الطالب  /student

   - صفحة رئيسية للطالب بعد تسجيل الدخول
   - Tailwind CSS + lucide-react
   - الألوان: #0A2947 / #A8C8E8 / #FFF2DB / #FFFAF3
   - عربي كامل + RTL
───────────────────────────────────────────────────────────────────────────── */

import {
  BookOpen,
  Calendar,
  FileText,
  User,
  GraduationCap,
  Settings,
  Bell,
  LogOut,
  ChevronLeft,
  CreditCard,
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ── بيانات بطاقات الوصول السريع ── */
const quickAccess = [
  {
    title: "لوحة التحكم",
    desc: "نظرة عامة على نشاطاتك وإحصائياتك الدراسية.",
    icon: LayoutDashboard,
    href: "#",
  },
  {
    title: "المقررات الدراسية",
    desc: "تصفّح جميع مقرراتك المسجّلة والمحتوى التعليمي.",
    icon: BookOpen,
    href: "#",
  },
  {
    title: "الجدول الدراسي",
    desc: "اطّلع على مواعيد محاضراتك وامتحاناتك.",
    icon: Calendar,
    href: "#",
  },
  {
    title: "النتائج والدرجات",
    desc: "تابع درجاتك وأداءك في جميع المقررات.",
    icon: FileText,
    href: "#",
  },
  {
    title: "الواجبات",
    desc: "استعرض الواجبات المطلوبة وسلّمها في الموعد.",
    icon: ClipboardList,
    href: "#",
  },
  {
    title: "المدفوعات",
    desc: "تحقّق من حالة الرسوم الدراسية وسجل الدفع.",
    icon: CreditCard,
    href: "#",
  },
  {
    title: "الملف الشخصي",
    desc: "عدّل بياناتك الشخصية وصورتك الرمزية.",
    icon: User,
    href: "#",
  },
  {
    title: "الرسائل",
    desc: "تواصل مع أساتذتك وإدارة الكلية مباشرةً.",
    icon: MessageSquare,
    href: "#",
  },
  {
    title: "الشهادات",
    desc: "اطّلع على شهاداتك وأوراق التخرج الرسمية.",
    icon: GraduationCap,
    href: "#",
  },
  {
    title: "الإعدادات",
    desc: "خصّص حسابك وإعدادات الإشعارات.",
    icon: Settings,
    href: "#",
  },
];

export default function StudentPage() {
  const router = useRouter();

  /* ── تسجيل الخروج ── */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  return (
    <div
      className="min-h-[100dvh] bg-[#FFFAF3] text-[#0A2947]"
      dir="rtl"
    >
      {/* ════════════════════════ شريط التنقل العلوي ════════════════════════ */}
      <nav className="bg-white border-b border-[#FFF2DB] px-4 sm:px-8 py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        {/* الشعار */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#0A2947] flex items-center justify-center shadow-md">
            <GraduationCap className="text-[#A8C8E8] w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-[#0A2947] tracking-tight">
            بوابة الطالب
          </h1>
        </div>

        {/* أيقونات اليمين */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* جرس الإشعارات */}
          <button
            className="relative p-2 rounded-full hover:bg-[#FFF2DB] transition-colors"
            aria-label="الإشعارات"
          >
            <Bell className="w-5 h-5 text-[#0A2947]" />
            {/* نقطة إشعار حمراء */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>

          {/* أفاتار الطالب */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#A8C8E8] flex items-center justify-center text-[#0A2947] font-extrabold text-sm shadow-inner select-none">
            ط
          </div>

          {/* زر الخروج — يظهر فقط على الشاشات الكبيرة */}
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1.5 text-red-500 hover:text-red-700 font-semibold text-sm transition-colors px-3 py-2 rounded-xl hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            خروج
          </button>
        </div>
      </nav>

      {/* ════════════════════════ المحتوى الرئيسي ════════════════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-28 sm:pb-12">

        {/* ── لافتة الترحيب ── */}
        <div className="relative bg-[#0A2947] rounded-3xl p-7 sm:p-12 text-white mb-10 overflow-hidden shadow-2xl animate-[fadeUp_0.4s_ease-out_both]">
          {/* محتوى اللافتة */}
          <div className="relative z-10 max-w-2xl">
            <p className="text-[#A8C8E8] text-xs sm:text-sm font-semibold mb-2 tracking-widest uppercase">
              منصة SMS التعليمية
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 text-[#FFFAF3] leading-snug">
              مرحباً بك في بوابتك الأكاديمية! 🎓
            </h2>
            <p className="text-[#A8C8E8]/90 text-sm sm:text-base mb-7 leading-relaxed">
              تابع مقرراتك، واطّلع على جدولك الدراسي، وراجع درجاتك — كل ذلك
              في مكان واحد.
            </p>
            <button className="bg-[#FFF2DB] text-[#0A2947] px-7 py-3 rounded-xl font-extrabold hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-sm sm:text-base cursor-pointer">
              ابدأ التعلم الآن
            </button>
          </div>

          {/* دوائر زخرفية خلفية */}
          <div className="absolute -left-16 -top-16 w-72 h-72 bg-[#A8C8E8] rounded-full opacity-10 pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#FFF2DB] rounded-full opacity-5 pointer-events-none" />
        </div>

        {/* ── عنوان الشبكة ── */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#0A2947]">
            الوصول السريع
          </h3>
          <span className="text-xs text-gray-400">{quickAccess.length} خدمة</span>
        </div>

        {/* ── شبكة البطاقات ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {quickAccess.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link
                key={i}
                href={item.href}
                className="group block"
                /* تأخير ظهور متدرّج لكل بطاقة */
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="bg-white border-2 border-[#FFF2DB] rounded-2xl p-5 h-full flex flex-col gap-3 transition-all duration-300 hover:border-[#A8C8E8] hover:shadow-xl hover:-translate-y-1 active:translate-y-0 animate-[fadeUp_0.45s_ease-out_both]">
                  {/* رأس البطاقة: أيقونة + سهم */}
                  <div className="flex items-start justify-between">
                    {/* حاوية الأيقونة */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#A8C8E8]/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#A8C8E8]/40">
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-[#0A2947]" />
                    </div>
                    {/* سهم التنقل */}
                    <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-[#0A2947] transition-colors mt-1" />
                  </div>

                  {/* نص البطاقة */}
                  <div>
                    <h4 className="text-base font-extrabold text-[#0A2947] mb-1">
                      {item.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      {/* ════════════════════════ شريط التنقل السفلي (موبايل فقط) ════════════════════════ */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#FFF2DB] px-6 py-3 flex justify-around items-center z-50">
        <Link href="#" className="flex flex-col items-center gap-0.5 text-[#0A2947]">
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[9px] font-bold">الرئيسية</span>
        </Link>
        <Link href="#" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-[#0A2947] transition-colors">
          <BookOpen className="w-6 h-6" />
          <span className="text-[9px] font-bold">مقرراتي</span>
        </Link>
        <Link href="#" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-[#0A2947] transition-colors">
          <Bell className="w-6 h-6" />
          <span className="text-[9px] font-bold">إشعارات</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 text-red-500 hover:text-red-700 transition-colors"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-[9px] font-bold">خروج</span>
        </button>
      </div>

      {/* ── تأثير الظهور التدريجي ── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
