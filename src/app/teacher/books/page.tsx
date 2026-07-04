"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   src/app/teacher/books/page.tsx
   صفحة إدارة الكتب — خاصة بالمعلم

   الميزات:
   - إضافة كتب ومصغرات جديدة
   - تحديد المستوى الدراسي لكل كتاب
   - عرض الكتب مع إمكانية التعديل والحذف
   - دعم الوضع الليلي + RTL + اللغة العربية
───────────────────────────────────────────────────────────────────────────── */

import {
  BookOpen, Search, GraduationCap, LogOut, ChevronLeft,
  Edit3, Check, X, AlertCircle, Loader2, RefreshCw,
  Menu, ChevronDown, Plus, Trash2, FileText, Book as BookIcon
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { getProfile, UserProfile } from "@/lib/api/user";
import { LEVEL_OPTIONS } from "@/lib/api/students";
import { getBooks, getBooksByLevel, getBooksByType, addBook, updateBook, deleteBook, Book as BookType } from "@/lib/api/books";
import { useTheme } from "@/components/ThemeProvider";
import { getColors } from "@/lib/theme/colors";
import ThemeToggle from "@/components/ThemeToggle";

const BOOK_TYPES = [
  { value: "book", label: "كتاب" },
  { value: "mini-book", label: "مصغر" },
] as const;

export default function TeacherBooksPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [books, setBooks] = useState<BookType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBook, setEditingBook] = useState<BookType | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    level: "one",
    type: "book" as "book" | "mini-book",
    fileUrl: "",
    coverUrl: "",
  });

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
        let data: BookType[] = [];
        
        if (levelFilter !== "all" && typeFilter !== "all") {
          // Filter by both level and type locally
          const levelBooks = await getBooksByLevel(levelFilter);
          data = levelBooks.filter(b => b.type === typeFilter);
        } else if (levelFilter !== "all") {
          data = await getBooksByLevel(levelFilter);
        } else if (typeFilter !== "all") {
          data = await getBooksByType(typeFilter as "book" | "mini-book");
        } else {
          data = await getBooks();
        }
        
        setBooks(data);
      } catch (err) {
        setError((err as Error).message || "فشل في تحميل الكتب.");
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, [levelFilter, typeFilter]);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: BookType[] = [];
      if (levelFilter !== "all" && typeFilter !== "all") {
        const levelBooks = await getBooksByLevel(levelFilter);
        data = levelBooks.filter(b => b.type === typeFilter);
      } else if (levelFilter !== "all") {
        data = await getBooksByLevel(levelFilter);
      } else if (typeFilter !== "all") {
        data = await getBooksByType(typeFilter as "book" | "mini-book");
      } else {
        data = await getBooks();
      }
      setBooks(data);
    } catch (err) {
      setError((err as Error).message || "فشل في تحميل الكتب.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  const handleAddBook = async () => {
    if (!formData.title.trim()) {
      setError("يرجى إدخال عنوان الكتاب");
      return;
    }
    
    setSaving(true);
    setError(null);
    try {
      await addBook(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setShowAddForm(false);
      setFormData({
        title: "",
        author: "",
        description: "",
        level: "one",
        type: "book",
        fileUrl: "",
        coverUrl: "",
      });
      await handleRefresh();
    } catch (err) {
      setError((err as Error).message || "فشل في إضافة الكتاب.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditBook = async () => {
    if (!editingBook || !formData.title.trim()) {
      setError("يرجى إدخال عنوان الكتاب");
      return;
    }
    
    setSaving(true);
    setError(null);
    try {
      await updateBook(editingBook.id || editingBook._id || "", formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setEditingBook(null);
      setFormData({
        title: "",
        author: "",
        description: "",
        level: "one",
        type: "book",
        fileUrl: "",
        coverUrl: "",
      });
      await handleRefresh();
    } catch (err) {
      setError((err as Error).message || "فشل في تحديث الكتاب.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBook = async (book: BookType) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الكتاب؟")) return;
    
    try {
      await deleteBook(book.id || book._id || "");
      await handleRefresh();
    } catch (err) {
      setError((err as Error).message || "فشل في حذف الكتاب.");
    }
  };

  const startEdit = (book: BookType) => {
    setEditingBook(book);
    setFormData({
      title: book.title || "",
      author: book.author || "",
      description: book.description || "",
      level: book.level || "one",
      type: (book.type as "book" | "mini-book") || "book",
      fileUrl: book.fileUrl || "",
      coverUrl: book.coverUrl || "",
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingBook(null);
    setShowAddForm(false);
    setFormData({
      title: "",
      author: "",
      description: "",
      level: "one",
      type: "book",
      fileUrl: "",
      coverUrl: "",
    });
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
    BOOK_TYPES.find(t => t.value === val)?.label ?? (val ?? "—");

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
          <Link href="/teacher" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#0A2947] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <BookOpen className="text-[#A8C8E8] w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight leading-none" style={{ color: C.textP }}>
              بوابة المعلم
            </h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: C.textM }}>
              إدارة الكتب
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          <Link
            href="/teacher"
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
              href="/teacher"
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
              إدارة الكتب والمصغرات 📚
            </h2>
            <p className="text-[#A8C8E8]/90 text-sm mb-4">
              أضف كتباً ومصغرات لكل مستوى دراسي. الطلاب سيتمكنون من رؤية الكتب الخاصة بمستواهم فقط.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#A8C8E8]" />
                <span className="text-white font-bold text-sm">{books.length} كتاب</span>
              </div>
            </div>
          </div>
          <div className="absolute -left-16 -top-16 w-72 h-72 bg-[#A8C8E8] rounded-full opacity-10 pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#FFF2DB] rounded-full opacity-5 pointer-events-none" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-[fadeUp_0.45s_ease-out_both]">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 -translate-y-1/2 right-4 w-4 h-4 pointer-events-none" style={{ color: C.textM }} />
            <input
              type="text"
              placeholder="ابحث بالعنوان أو المؤلف..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-11 pl-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all"
              style={{ backgroundColor: C.input, border: `2px solid ${C.border}`, color: C.textP }}
              onFocus={e => (e.target.style.borderColor = C.borderA)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </div>

          <div className="relative">
            <ChevronDown className="absolute top-1/2 -translate-y-1/2 left-4 w-4 h-4 pointer-events-none" style={{ color: C.textM }} />
            <select
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value)}
              className="appearance-none pr-4 pl-10 py-3 rounded-2xl text-sm font-semibold outline-none transition-all cursor-pointer"
              style={{ backgroundColor: C.input, border: `2px solid ${C.border}`, color: C.textP, minWidth: "180px" }}
              onFocus={e => (e.target.style.borderColor = C.borderA)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            >
              <option value="all">جميع المستويات</option>
              {LEVEL_OPTIONS.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <ChevronDown className="absolute top-1/2 -translate-y-1/2 left-4 w-4 h-4 pointer-events-none" style={{ color: C.textM }} />
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="appearance-none pr-4 pl-10 py-3 rounded-2xl text-sm font-semibold outline-none transition-all cursor-pointer"
              style={{ backgroundColor: C.input, border: `2px solid ${C.border}`, color: C.textP, minWidth: "150px" }}
              onFocus={e => (e.target.style.borderColor = C.borderA)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            >
              <option value="all">جميع الأنواع</option>
              {BOOK_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setShowAddForm(true); setEditingBook(null); }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-md"
              style={{ backgroundColor: "#16a34a", color: "#fff" }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">إضافة كتاب</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#0A2947", color: "#A8C8E8" }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">تحديث</span>
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="rounded-2xl p-6 mb-6 animate-[fadeUp_0.3s_ease-out_both]" style={{ backgroundColor: C.card, border: `2px solid ${C.border}`, boxShadow: C.cardSh }}>
            <h3 className="text-lg font-extrabold mb-4" style={{ color: C.textP }}>
              {editingBook ? "تعديل الكتاب" : "إضافة كتاب جديد"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1.5" style={{ color: C.textM }}>عنوان الكتاب *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
                  style={{ backgroundColor: C.input, border: `2px solid ${C.border}`, color: C.textP }}
                  onFocus={e => (e.target.style.borderColor = C.borderA)}
                  onBlur={e => (e.target.style.borderColor = C.border)}
                  placeholder="أدخل عنوان الكتاب"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: C.textM }}>المؤلف</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={e => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
                  style={{ backgroundColor: C.input, border: `2px solid ${C.border}`, color: C.textP }}
                  onFocus={e => (e.target.style.borderColor = C.borderA)}
                  onBlur={e => (e.target.style.borderColor = C.border)}
                  placeholder="اسم المؤلف"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: C.textM }}>نوع الكتاب</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as "book" | "mini-book" })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold outline-none transition-all cursor-pointer"
                  style={{ backgroundColor: C.input, border: `2px solid ${C.border}`, color: C.textP }}
                  onFocus={e => (e.target.style.borderColor = C.borderA)}
                  onBlur={e => (e.target.style.borderColor = C.border)}
                >
                  {BOOK_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: C.textM }}>المستوى الدراسي</label>
                <select
                  value={formData.level}
                  onChange={e => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold outline-none transition-all cursor-pointer"
                  style={{ backgroundColor: C.input, border: `2px solid ${C.border}`, color: C.textP }}
                  onFocus={e => (e.target.style.borderColor = C.borderA)}
                  onBlur={e => (e.target.style.borderColor = C.border)}
                >
                  {LEVEL_OPTIONS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: C.textM }}>رابط الملف</label>
                <input
                  type="url"
                  value={formData.fileUrl}
                  onChange={e => setFormData({ ...formData, fileUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
                  style={{ backgroundColor: C.input, border: `2px solid ${C.border}`, color: C.textP }}
                  onFocus={e => (e.target.style.borderColor = C.borderA)}
                  onBlur={e => (e.target.style.borderColor = C.border)}
                  placeholder="https://example.com/book.pdf"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1.5" style={{ color: C.textM }}>الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all resize-none"
                  style={{ backgroundColor: C.input, border: `2px solid ${C.border}`, color: C.textP }}
                  onFocus={e => (e.target.style.borderColor = C.borderA)}
                  onBlur={e => (e.target.style.borderColor = C.border)}
                  placeholder="وصف مختصر للكتاب"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={editingBook ? handleEditBook : handleAddBook}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60"
                style={{ backgroundColor: "#0A2947", color: "#A8C8E8" }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all"
                style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#dc2626" }}
              >
                <X className="w-4 h-4" />
                إلغاء
              </button>
            </div>
          </div>
        )}

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
            <button onClick={() => setError(null)} className="mr-auto text-red-400 hover:text-red-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {saveSuccess && (
          <div className="rounded-2xl p-4 mb-4 flex items-center gap-3 animate-[fadeUp_0.3s_ease-out_both]" style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "2px solid rgba(34,197,94,0.25)" }}>
            <Check className="w-5 h-5 text-green-500 shrink-0" />
            <p className="text-green-600 text-sm font-semibold">تم حفظ الكتاب بنجاح!</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 animate-[fadeUp_0.4s_ease-out_both]">
            <BookOpen className="w-16 h-16 mb-4 opacity-20" style={{ color: C.textM }} />
            <p className="text-lg font-bold mb-1" style={{ color: C.textS }}>لا يوجد كتب</p>
            <p className="text-sm" style={{ color: C.textM }}>ابدأ بإضافة كتب للمكتبة.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-[fadeUp_0.5s_ease-out_both]">
              {filtered.map((book, idx) => (
                <div
                  key={book.id || book._id || idx}
                  className={`rounded-2xl p-5 ${tr}`}
                  style={{ backgroundColor: C.card, border: `2px solid ${C.border}`, boxShadow: C.cardSh }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: book.type === "mini-book" ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.15)" }}>
                      {book.type === "mini-book" ? (
                        <FileText className="w-6 h-6" style={{ color: "#f59e0b" }} />
                      ) : (
                        <BookIcon className="w-6 h-6" style={{ color: "#3b82f6" }} />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(book)}
                        className="p-2 rounded-xl transition-all hover:scale-110"
                        style={{ backgroundColor: "rgba(168,200,232,0.2)", color: "#0A2947" }}
                        title="تعديل"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBook(book)}
                        className="p-2 rounded-xl transition-all hover:scale-110"
                        style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#dc2626" }}
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-extrabold text-sm mb-1" style={{ color: C.textP }}>
                    {book.title || "بدون عنوان"}
                  </h4>
                  {book.author && (
                    <p className="text-xs mb-2" style={{ color: C.textM }}>
                      المؤلف: {book.author}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: "rgba(168,200,232,0.15)", color: "#0A2947" }}>
                      {levelLabel(book.level)}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: book.type === "mini-book" ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.15)", color: book.type === "mini-book" ? "#f59e0b" : "#3b82f6" }}>
                      {typeLabel(book.type)}
                    </span>
                  </div>
                  {book.description && (
                    <p className="text-xs line-clamp-2" style={{ color: C.textS }}>
                      {book.description}
                    </p>
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
