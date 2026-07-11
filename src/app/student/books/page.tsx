"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   src/app/student/books/page.tsx
   صفحة الكتب — خاصة بالطالب

   الميزات:
   - عرض الكتب والمصغرات الخاصة بمستوى الطالب
   - عرض تفاصيل الكتاب مع إمكانية التحميل/المشاهدة
   - دعم الوضع الليلي + RTL + اللغة العربية
───────────────────────────────────────────────────────────────────────────── */

import {
  GraduationCap, LogOut, ChevronLeft, AlertCircle, Loader2,
  Menu, X, BookOpen, FileText, Search, ExternalLink
, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { getProfile, UserProfile } from "@/lib/api/user";
import { getStudentBooks, Book } from "@/lib/api/books";
import { LEVEL_OPTIONS } from "@/lib/api/students";
import { useTheme } from "@/components/ThemeProvider";
import { getColors } from "@/lib/theme/colors";
import ThemeToggle from "@/components/ThemeToggle";

export default function StudentBooksPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tr = "transition-all duration-300 ease-in-out";

  useEffect(() => {
    getProfile().then(p => setProfile(p)).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getStudentBooks();
        setBooks(data);
      } catch (err) {
        setError((err as Error).message || "فشل في تحميل الكتب.");
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  const filtered = useMemo(() => {
    return books.filter(b => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (b.title || "").toLowerCase().includes(q) ||
             (b.author || "").toLowerCase().includes(q) ||
             (b.description || "").toLowerCase().includes(q);
    });
  }, [books, searchQuery]);

  const levelLabel = (val?: string) =>
    LEVEL_OPTIONS.find(l => l.value === val)?.label ?? (val ?? "—");

  const typeLabel = (val?: string) =>
    val === "mini-book" ? "مصغر" : "كتاب";

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
              <BookOpen className="text-[#A8C8E8] w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight leading-none" style={{ color: C.textP }}>
              بوابة الطالب
            </h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: C.textM }}>
              المكتبة
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
              منصة SMS التعليمية — قسم المكتبة
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 text-[#FFFAF3]">
              الكتب والمصغرات 📚
            </h2>
            <p className="text-[#A8C8E8]/90 text-sm mb-4">
              تصفح الكتب والمصغرات الخاصة بمستواك الدراسي. اضغط على أي كتاب لعرض التفاصيل أو التحميل.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#A8C8E8]" />
                <span className="text-white font-bold text-sm">{books.length} كتاب متاح</span>
              </div>
              {profile?.level && (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2">
                  <span className="text-white font-bold text-sm">{levelLabel(profile.level)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="absolute -left-16 -top-16 w-72 h-72 bg-[#A8C8E8] rounded-full opacity-10 pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#FFF2DB] rounded-full opacity-5 pointer-events-none" />
        </div>

        <div className="mb-6 animate-[fadeUp_0.45s_ease-out_both]">
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 right-4 w-4 h-4 pointer-events-none" style={{ color: C.textM }} />
            <input
              type="text"
              placeholder="ابحث في الكتب..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-11 pl-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all"
              style={{ backgroundColor: C.input, border: `2px solid ${C.border}`, color: C.textP }}
              onFocus={e => (e.target.style.borderColor = C.borderA)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 animate-[fadeUp_0.4s_ease-out_both]">
            <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: "#A8C8E8" }} />
            <p className="text-lg font-semibold" style={{ color: C.textM }}>جاري تحميل الكتب...</p>
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

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 animate-[fadeUp_0.4s_ease-out_both]">
            <BookOpen className="w-16 h-16 mb-4 opacity-20" style={{ color: C.textM }} />
            <p className="text-lg font-bold mb-1" style={{ color: C.textS }}>لا يوجد كتب</p>
            <p className="text-sm" style={{ color: C.textM }}>سيتم إضافة الكتب الخاصة بمستواك قريباً.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-[fadeUp_0.5s_ease-out_both]">
              {filtered.map((book, idx) => (
                <div
                  key={book.id || book._id || idx}
                  className={`rounded-2xl p-5 ${tr} group hover:-translate-y-1`}
                  style={{ backgroundColor: C.card, border: `2px solid ${C.border}`, boxShadow: C.cardSh }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: book.type === "mini-book" ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.15)" }}>
                      {book.type === "mini-book" ? (
                        <FileText className="w-7 h-7" style={{ color: "#f59e0b" }} />
                      ) : (
                        <BookOpen className="w-7 h-7" style={{ color: "#3b82f6" }} />
                      )}
                    </div>
                    {book.fileUrl && (
                      <a
                        href={book.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl transition-all hover:scale-110"
                        style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "#16a34a" }}
                        title="فتح الكتاب"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <h4 className="font-extrabold text-base mb-2 group-hover:text-[#3d8ec2] transition-colors" style={{ color: C.textP }}>
                    {book.title || "بدون عنوان"}
                  </h4>
                  
                  {book.author && (
                    <p className="text-xs mb-2" style={{ color: C.textM }}>
                      المؤلف: {book.author}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: "rgba(168,200,232,0.15)", color: "#0A2947" }}>
                      {levelLabel(book.level)}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: book.type === "mini-book" ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.15)", color: book.type === "mini-book" ? "#f59e0b" : "#3b82f6" }}>
                      {typeLabel(book.type)}
                    </span>
                  </div>

                  {book.description && (
                    <p className="text-xs line-clamp-3 mb-3" style={{ color: C.textS }}>
                      {book.description}
                    </p>
                  )}

                  {book.fileUrl && (
                    <a
                      href={book.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                      style={{ backgroundColor: "#0A2947", color: "#A8C8E8" }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      فتح الكتاب
                    </a>
                  )}
                </div>
              ))}
            </div>

            <p className="text-center text-xs mt-6" style={{ color: C.textM }}>
              عرض <strong>{filtered.length}</strong> من أصل <strong>{books.length}</strong> كتاب
            </p>
          </>
        )}
      </main>
    </div>
  );
}
