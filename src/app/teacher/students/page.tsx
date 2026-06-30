"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   src/app/teacher/students/page.tsx
   صفحة إدارة الطلاب — خاصة بالمعلم

   الميزات:
   - جلب جميع الطلاب المسجّلين من API /admin/students
   - عرض الطلاب في جدول أنيق مع بحث وفلترة حسب المستوى
   - تحديث مستوى كل طالب (حتى المستوى الثاني عشر "twelve")
   - دعم الوضع الليلي + RTL + اللغة العربية
───────────────────────────────────────────────────────────────────────────── */

import {
  Users, Search, GraduationCap, LogOut, ChevronLeft,
  Edit3, Check, X, AlertCircle, Loader2, RefreshCw,
  BookOpen, Menu, ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { getProfile, UserProfile } from "@/lib/api/user";
import { getStudents, getStudentsByLevel, updateStudentLevel, LEVEL_OPTIONS, Student } from "@/lib/api/students";
import { useTheme } from "@/components/ThemeProvider";
import { getColors } from "@/lib/theme/colors";
import ThemeToggle from "@/components/ThemeToggle";

/* ════════════════════════════════════════════════════════════════════════════
   المكوّن الرئيسي — صفحة إدارة الطلاب
════════════════════════════════════════════════════════════════════════════ */
export default function TeacherStudentsPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);

  /* ── حالات البيانات ── */
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── حالة البحث والفلترة ── */
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  /* ── حالة تعديل المستوى ── */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLevel, setEditLevel] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [promoting, setPromoting] = useState(false);

  /* ── القائمة الجانبية للموبايل ── */
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /* ── transition مشترك ── */
  const tr = "transition-all duration-300 ease-in-out";

  /* ── جلب بيانات المعلم (مرة واحدة) ── */
  useEffect(() => {
    getProfile().then(p => setProfile(p)).catch(() => {});
  }, []);

  /* ── جلب الطلاب بناءً على الفلتر ── */
  useEffect(() => {
    const fetchStudentsData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (levelFilter === "all") {
          setStudents(await getStudents());
        } else {
          setStudents(await getStudentsByLevel(levelFilter));
        }
      } catch (err) {
        setError((err as Error).message || "فشل في تحميل البيانات.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudentsData();
  }, [levelFilter]);

  /* ── دالة إعادة التحميل ── */
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    setEditingId(null);
    try {
      if (levelFilter === "all") {
        setStudents(await getStudents());
      } else {
        setStudents(await getStudentsByLevel(levelFilter));
      }
    } catch (err) {
      setError((err as Error).message || "فشل في تحميل البيانات.");
    } finally {
      setLoading(false);
    }
  };

  /* ── تسجيل الخروج ── */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  /* ── بدء تعديل مستوى طالب ── */
  const startEdit = (student: Student) => {
    const id = String(student._id ?? student.id ?? "");
    setEditingId(id);
    setEditLevel(student.level ?? "one");
    setSaveError(null);
  };

  /* ── إلغاء التعديل ── */
  const cancelEdit = () => {
    setEditingId(null);
    setEditLevel("");
    setSaveError(null);
  };

  /* ── حفظ المستوى الجديد ── */
  const saveLevel = async (student: Student) => {
    const id = String(student._id ?? student.id ?? "");
    setSavingId(id);
    setSaveError(null);
    try {
      await updateStudentLevel(id, editLevel);

      /* تحديث القائمة المحلية بدون إعادة جلب كاملة */
      setStudents(prev =>
        prev.map(s =>
          String(s._id ?? s.id) === id ? { ...s, level: editLevel } : s
        )
      );

      setEditingId(null);
      setSuccessId(id);
      /* إزالة علامة النجاح بعد ثانيتين */
      setTimeout(() => setSuccessId(null), 2000);
    } catch (err) {
      setSaveError((err as Error).message || "فشل في تحديث المستوى.");
    } finally {
      setSavingId(null);
    }
  };

  /* ── ترقية جميع الطلاب في القائمة الحالية (مستوى واحد لأعلى) ── */
  const promoteAll = async () => {
    if (!window.confirm("هل أنت متأكد من ترقية جميع الطلاب في القائمة الحالية للمستوى التالي؟")) return;
    setPromoting(true);
    setSaveError(null);
    try {
      const updatedStudents = [...students];
      for (const student of filtered) {
        const id = String(student._id ?? student.id);
        const currentLevelIndex = LEVEL_OPTIONS.findIndex(l => l.value === student.level);
        if (currentLevelIndex >= 0 && currentLevelIndex < LEVEL_OPTIONS.length - 1) {
          const nextLevel = LEVEL_OPTIONS[currentLevelIndex + 1].value;
          await updateStudentLevel(id, nextLevel);
          const sIdx = updatedStudents.findIndex(s => String(s._id ?? s.id) === id);
          if (sIdx > -1) updatedStudents[sIdx].level = nextLevel;
        }
      }
      setStudents(updatedStudents);
      alert("تمت الترقية بنجاح!");
    } catch (err) {
      setSaveError("حدث خطأ أثناء ترقية بعض الطلاب. يرجى إعادة المحاولة.");
    } finally {
      setPromoting(false);
    }
  };

  /* ── مساعد: الاسم المعروض للطالب ── */
  const displayName = (s: Student) =>
    s.fullName ?? s.name ?? s.userName ?? "—";

  /* ── مساعد: تسمية المستوى بالعربي ── */
  const levelLabel = (val?: string) =>
    LEVEL_OPTIONS.find(l => l.value === val)?.label ?? (val ?? "—");

  /* ── مساعد: الحرف الأول للأفاتار ── */
  const initial = (s: Student) =>
    (displayName(s)).charAt(0).toUpperCase();

  /* ── فلترة ومقارنة الطلاب حسب البحث مع الترتيب ── */
  const filtered = useMemo(() => {
    let result = students;

    // 1. الفلترة حسب البحث
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        displayName(s).toLowerCase().includes(q) ||
        (s.userName ?? "").toLowerCase().includes(q)
      );
    }

    // 2. الترتيب: حسب المستوى أولاً، ثم أبجدياً بالاسم
    return result.sort((a, b) => {
      const levelA = LEVEL_OPTIONS.findIndex(l => l.value === a.level);
      const levelB = LEVEL_OPTIONS.findIndex(l => l.value === b.level);
      
      // إذا اختلف المستوى، نرتب حسب ترتيب المستويات
      if (levelA !== levelB) {
        // إذا كان أحدهما بدون مستوى (index = -1)، نضعه في النهاية
        if (levelA === -1) return 1;
        if (levelB === -1) return -1;
        return levelA - levelB;
      }
      
      // إذا تساوى المستوى، نرتب أبجدياً حسب الاسم (أ إلى ي)
      const nameA = displayName(a);
      const nameB = displayName(b);
      return nameA.localeCompare(nameB, 'ar');
    });
  }, [students, searchQuery]);

  /* ── ألوان دوريّة للأفاتارات ── */
  const avatarColors = [
    "#0A2947", "#1a4a7a", "#2d6b9e", "#3d8ec2",
    "#1e5f8e", "#0e3b63", "#264d73",
  ];
  const avatarColor = (idx: number) => avatarColors[idx % avatarColors.length];

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
        {/* الشعار والتنقل */}
        <div className="flex items-center gap-3">
          <Link href="/teacher" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#0A2947] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <GraduationCap className="text-[#A8C8E8] w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight leading-none" style={{ color: C.textP }}>
              بوابة المعلم
            </h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: C.textM }}>
              إدارة الطلاب
            </p>
          </div>
        </div>

        {/* أيقونات اليمين */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* رابط لوحة التحكم */}
          <Link
            href="/teacher"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-all hover:-translate-y-0.5"
            style={{ color: C.textS, backgroundColor: C.icon }}
          >
            <BookOpen className="w-4 h-4" />
            لوحة التحكم
          </Link>

          {/* زر الخروج */}
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1.5 text-red-500 hover:text-red-700 font-semibold text-sm transition-colors px-3 py-2 rounded-xl hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            خروج
          </button>

          {/* زر الموبايل */}
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
              <BookOpen className="w-5 h-5" />
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

      {/* ════════════ المحتوى الرئيسي ════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* ── لافتة الصفحة ── */}
        <div
          className={`relative rounded-3xl p-6 sm:p-10 text-white mb-8 overflow-hidden shadow-2xl animate-[fadeUp_0.4s_ease-out_both] ${tr}`}
          style={{ backgroundColor: C.hero }}
        >
          <div className="relative z-10">
            <p className="text-[#A8C8E8] text-xs sm:text-sm font-semibold mb-2 tracking-widest uppercase">
              بوابة المعلم — منصة SMS التعليمية
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 text-[#FFFAF3]">
              إدارة الطلاب المسجّلين 👨‍🎓
            </h2>
            <p className="text-[#A8C8E8]/90 text-sm mb-4">
              {profile
                ? `مرحباً ${profile.fullName ?? profile.name ?? profile.userName ?? ""}، يمكنك هنا عرض وتحديث مستويات جميع الطلاب.`
                : "يمكنك هنا عرض جميع الطلاب المسجّلين وتحديث مستوياتهم الدراسية."}
            </p>
            {/* بطاقات الإحصاء السريع */}
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#A8C8E8]" />
                <span className="text-white font-bold text-sm">{students.length} طالب</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2">
                <Search className="w-4 h-4 text-[#A8C8E8]" />
                <span className="text-white font-bold text-sm">{filtered.length} نتيجة</span>
              </div>
            </div>
          </div>
          {/* دوائر زخرفية */}
          <div className="absolute -left-16 -top-16 w-72 h-72 bg-[#A8C8E8] rounded-full opacity-10 pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#FFF2DB] rounded-full opacity-5 pointer-events-none" />
        </div>

        {/* ── شريط البحث والفلترة ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-[fadeUp_0.45s_ease-out_both]">

          {/* حقل البحث */}
          <div className="relative flex-1">
            <Search
              className="absolute top-1/2 -translate-y-1/2 right-4 w-4 h-4 pointer-events-none"
              style={{ color: C.textM }}
            />
            <input
              type="text"
              placeholder="ابحث بالاسم أو اسم المستخدم..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-11 pl-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all"
              style={{
                backgroundColor: C.input,
                border: `2px solid ${C.border}`,
                color: C.textP,
              }}
              onFocus={e => (e.target.style.borderColor = C.borderA)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </div>

          {/* فلتر المستوى */}
          <div className="relative">
            <ChevronDown
              className="absolute top-1/2 -translate-y-1/2 left-4 w-4 h-4 pointer-events-none"
              style={{ color: C.textM }}
            />
            <select
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value)}
              className="appearance-none pr-4 pl-10 py-3 rounded-2xl text-sm font-semibold outline-none transition-all cursor-pointer"
              style={{
                backgroundColor: C.input,
                border: `2px solid ${C.border}`,
                color: C.textP,
                minWidth: "180px",
              }}
              onFocus={e => (e.target.style.borderColor = C.borderA)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            >
              <option value="all">جميع المستويات</option>
              {LEVEL_OPTIONS.map(l => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* زر الترقية الشاملة */}
          <button
            onClick={promoteAll}
            disabled={promoting || loading || filtered.length === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "#16a34a" }}
            title="ترقية جميع الطلاب في القائمة للمستوى التالي"
          >
            {promoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
            ترقية الكل
          </button>

          {/* زر إعادة التحميل */}
          <button
            onClick={handleRefresh}
            disabled={loading || promoting}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#0A2947", color: "#A8C8E8" }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>

        {/* ── حالة التحميل ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 animate-[fadeUp_0.4s_ease-out_both]">
            <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: "#A8C8E8" }} />
            <p className="text-lg font-semibold" style={{ color: C.textM }}>جاري تحميل بيانات الطلاب...</p>
          </div>
        )}

        {/* ── حالة الخطأ ── */}
        {!loading && error && (
          <div
            className="rounded-2xl p-5 mb-6 flex items-start gap-3 animate-[fadeUp_0.4s_ease-out_both]"
            style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "2px solid rgba(239,68,68,0.25)" }}
          >
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-red-600 text-sm mb-1">حدث خطأ أثناء جلب البيانات</p>
              <p className="text-red-500/80 text-xs">{error}</p>
            </div>
          </div>
        )}

        {/* ── لا يوجد نتائج ── */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 animate-[fadeUp_0.4s_ease-out_both]">
            <Users className="w-16 h-16 mb-4 opacity-20" style={{ color: C.textM }} />
            <p className="text-lg font-bold mb-1" style={{ color: C.textS }}>
              {students.length === 0 ? "لا يوجد طلاب مسجّلون بعد" : "لا توجد نتائج مطابقة"}
            </p>
            <p className="text-sm" style={{ color: C.textM }}>
              {students.length === 0
                ? "ستظهر هنا قائمة الطلاب فور تسجيلهم."
                : "جرّب تغيير كلمة البحث أو الفلتر."}
            </p>
          </div>
        )}

        {/* ── رسالة خطأ الحفظ ── */}
        {saveError && (
          <div
            className="rounded-2xl p-4 mb-4 flex items-center gap-3 animate-[fadeUp_0.3s_ease-out_both]"
            style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "2px solid rgba(239,68,68,0.25)" }}
          >
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-red-600 text-sm font-semibold">{saveError}</p>
            <button onClick={() => setSaveError(null)} className="mr-auto text-red-400 hover:text-red-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ════════════ جدول الطلاب — Desktop ════════════ */}
        {!loading && !error && filtered.length > 0 && (
          <>
            {/* ── جدول — شاشات كبيرة ── */}
            <div
              className="hidden md:block rounded-3xl overflow-hidden shadow-xl animate-[fadeUp_0.5s_ease-out_both]"
              style={{ border: `2px solid ${C.border}` }}
            >
              {/* رأس الجدول */}
              <div
                className="grid grid-cols-[3rem_2fr_1.5fr_1.5fr_1.5fr_8rem] gap-4 px-6 py-4 text-xs font-extrabold tracking-widest uppercase"
                style={{ backgroundColor: "#0A2947", color: "#A8C8E8" }}
              >
                <span>#</span>
                <span>الطالب</span>
                <span>اسم المستخدم</span>
                <span>كلمة المرور</span>
                <span>المستوى الدراسي</span>
                <span className="text-center">إجراء</span>
              </div>

              {/* صفوف الطلاب */}
              {filtered.map((student, idx) => {
                const id = String(student._id ?? student.id ?? idx);
                const isEditing = editingId === id;
                const isSaving  = savingId  === id;
                const isSuccess = successId === id;

                return (
                  <div
                    key={id}
                    className={`grid grid-cols-[3rem_2fr_1.5fr_1.5fr_1.5fr_8rem] gap-4 px-6 py-4 items-center ${tr} border-b last:border-b-0`}
                    style={{
                      backgroundColor: isEditing ? (isDark ? "#1a2d42" : "#F0F7FF") : C.card,
                      borderColor: C.border,
                    }}
                  >
                    {/* رقم الصف */}
                    <span className="text-sm font-bold" style={{ color: C.textM }}>
                      {idx + 1}
                    </span>

                    {/* اسم الطالب مع الأفاتار */}
                    <Link href={`/teacher/students/${id}`} className="flex items-center gap-3 group">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-md transition-transform group-hover:scale-110"
                        style={{ backgroundColor: avatarColor(idx) }}
                      >
                        {initial(student)}
                      </div>
                      <span className="font-bold text-sm transition-colors hover:text-[#3d8ec2]" style={{ color: C.textP }}>
                        {displayName(student)}
                      </span>
                    </Link>

                    {/* اسم المستخدم */}
                    <span className="text-sm" style={{ color: C.textS }}>
                      {student.userName ?? "—"}
                    </span>

                    {/* كلمة المرور */}
                    <span className="text-sm font-mono bg-black/5 px-2 py-1 rounded" style={{ color: C.textS }}>
                      {(student.plainPassword as string) || (student.password as string) || "—"}
                    </span>

                    {/* المستوى — وضع العرض أو التعديل */}
                    <div>
                      {isEditing ? (
                        <div className="relative">
                          <ChevronDown
                            className="absolute top-1/2 -translate-y-1/2 left-2 w-3 h-3 pointer-events-none"
                            style={{ color: C.textM }}
                          />
                          <select
                            value={editLevel}
                            onChange={e => setEditLevel(e.target.value)}
                            className="appearance-none w-full pr-3 pl-7 py-2 rounded-xl text-xs font-bold outline-none transition-all cursor-pointer"
                            style={{
                              backgroundColor: C.input,
                              border: `2px solid #A8C8E8`,
                              color: C.textP,
                            }}
                            autoFocus
                          >
                            {LEVEL_OPTIONS.map(l => (
                              <option key={l.value} value={l.value}>{l.label}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                          style={{
                            backgroundColor: isSuccess ? "rgba(34,197,94,0.12)" : "rgba(168,200,232,0.18)",
                            color: isSuccess ? "#16a34a" : "#0A2947",
                            border: `1.5px solid ${isSuccess ? "rgba(34,197,94,0.4)" : C.borderA}`,
                          }}
                        >
                          {isSuccess && <Check className="w-3 h-3" />}
                          {levelLabel(student.level)}
                        </span>
                      )}
                    </div>

                    {/* أزرار الإجراء */}
                    <div className="flex items-center justify-center gap-2">
                      {isEditing ? (
                        <>
                          {/* حفظ */}
                          <button
                            onClick={() => saveLevel(student)}
                            disabled={isSaving}
                            className="p-2 rounded-xl transition-all hover:scale-110 active:scale-95 disabled:opacity-60"
                            style={{ backgroundColor: "rgba(34,197,94,0.12)", color: "#16a34a" }}
                            title="حفظ"
                          >
                            {isSaving
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Check className="w-4 h-4" />}
                          </button>
                          {/* إلغاء */}
                          <button
                            onClick={cancelEdit}
                            disabled={isSaving}
                            className="p-2 rounded-xl transition-all hover:scale-110 active:scale-95"
                            style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#dc2626" }}
                            title="إلغاء"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startEdit(student)}
                          className="p-2 rounded-xl transition-all hover:scale-110 active:scale-95"
                          style={{ backgroundColor: "rgba(168,200,232,0.2)", color: "#0A2947" }}
                          title="تعديل المستوى"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ════════════ بطاقات الطلاب — Mobile ════════════ */}
            <div className="md:hidden flex flex-col gap-4 animate-[fadeUp_0.5s_ease-out_both]">
              {filtered.map((student, idx) => {
                const id = String(student._id ?? student.id ?? idx);
                const isEditing = editingId === id;
                const isSaving  = savingId  === id;
                const isSuccess = successId === id;

                return (
                  <div
                    key={id}
                    className={`rounded-2xl p-5 ${tr}`}
                    style={{
                      backgroundColor: C.card,
                      border: `2px solid ${isEditing ? C.borderA : C.border}`,
                      boxShadow: C.cardSh,
                    }}
                  >
                    {/* رأس البطاقة */}
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold text-lg shrink-0 shadow-md"
                        style={{ backgroundColor: avatarColor(idx) }}
                      >
                        {initial(student)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/teacher/students/${id}`} className="hover:opacity-80 transition-opacity">
                          <p className="font-extrabold text-sm truncate" style={{ color: C.textP }}>
                            {displayName(student)}
                          </p>
                        </Link>
                        <p className="text-xs truncate mt-0.5" style={{ color: C.textM }}>
                          {student.userName ?? "—"}
                        </p>
                      </div>
                      {/* زر التعديل */}
                      {!isEditing && (
                        <button
                          onClick={() => startEdit(student)}
                          className="p-2 rounded-xl transition-all hover:scale-110"
                          style={{ backgroundColor: "rgba(168,200,232,0.2)", color: "#0A2947" }}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* كلمة المرور */}
                    <div className="mb-3">
                      <p className="text-xs font-semibold mb-1.5" style={{ color: C.textM }}>كلمة المرور</p>
                      <span className="text-sm font-mono bg-black/5 px-2 py-1 rounded" style={{ color: C.textP }}>
                        {(student.plainPassword as string) || (student.password as string) || "—"}
                      </span>
                    </div>

                    {/* المستوى */}
                    <div className="mb-3">
                      <p className="text-xs font-semibold mb-1.5" style={{ color: C.textM }}>المستوى الدراسي</p>
                      {isEditing ? (
                        <div className="relative">
                          <ChevronDown className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 pointer-events-none" style={{ color: C.textM }} />
                          <select
                            value={editLevel}
                            onChange={e => setEditLevel(e.target.value)}
                            className="appearance-none w-full pr-4 pl-9 py-2.5 rounded-xl text-sm font-bold outline-none"
                            style={{
                              backgroundColor: C.input,
                              border: `2px solid #A8C8E8`,
                              color: C.textP,
                            }}
                            autoFocus
                          >
                            {LEVEL_OPTIONS.map(l => (
                              <option key={l.value} value={l.value}>{l.label}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold"
                          style={{
                            backgroundColor: isSuccess ? "rgba(34,197,94,0.12)" : "rgba(168,200,232,0.18)",
                            color: isSuccess ? "#16a34a" : "#0A2947",
                            border: `1.5px solid ${isSuccess ? "rgba(34,197,94,0.4)" : C.borderA}`,
                          }}
                        >
                          {isSuccess && <Check className="w-3.5 h-3.5" />}
                          {levelLabel(student.level)}
                        </span>
                      )}
                    </div>

                    {/* أزرار الحفظ/الإلغاء */}
                    {isEditing && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveLevel(student)}
                          disabled={isSaving}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60"
                          style={{ backgroundColor: "rgba(34,197,94,0.12)", color: "#16a34a" }}
                        >
                          {isSaving
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Check className="w-4 h-4" />}
                          حفظ
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={isSaving}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all"
                          style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#dc2626" }}
                        >
                          <X className="w-4 h-4" />
                          إلغاء
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── تذييل بعدد النتائج ── */}
            <p className="text-center text-xs mt-6" style={{ color: C.textM }}>
              عرض <strong>{filtered.length}</strong> من أصل <strong>{students.length}</strong> طالب مسجّل
            </p>
          </>
        )}
      </main>
    </div>
  );
}
