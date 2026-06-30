"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   src/app/teacher/exams/page.tsx
   صفحة إدارة الاختبارات — خاصة بالمعلم

   الميزات:
   - إنشاء اختبار جديد مع عنوان / مستوى / تاريخ / مدة / أسئلة متعددة الخيارات
   - جلب قائمة اختبارات المعلم مباشرة من الـ API (بدون localStorage)
   - تفعيل / إيقاف الاختبار عبر API
   - عرض نتائج الطلاب من API
   - حذف اختبار
   - دعم الوضع الليلي + RTL + عربي
───────────────────────────────────────────────────────────────────────────── */

import {
  GraduationCap, Plus, Trash2, Search, BookOpen,
  Clock, Calendar, Loader2, AlertCircle, X, Check,
  ChevronDown, LogOut, Menu, ClipboardList, Eye, HelpCircle, Copy, Pencil
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { getProfile, UserProfile } from "@/lib/api/user";
import { createExamWithQuestions, addQuestionsToExam, deleteExam, getExam, getTeacherExams, Exam, ExamQuestion, activeExam, getExamResults } from "@/lib/api/exams";
import { LEVEL_OPTIONS } from "@/lib/api/students";
import { useTheme } from "@/components/ThemeProvider";
import { getColors } from "@/lib/theme/colors";
import ThemeToggle from "@/components/ThemeToggle";

/* ── سؤال فارغ جديد ── */
const emptyQuestion = (): ExamQuestion => ({
  question: "",
  type: "mcq",
  choices: ["", "", "", ""],
  answer: "",
});

export default function TeacherExamsPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);
  const tr = "transition-all duration-300 ease-in-out";

  /* ── بيانات المعلم ── */
  const [profile, setProfile] = useState<UserProfile | null>(null);

  /* ── قائمة الاختبارات ── */
  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);

  /* ── فتح/إغلاق نموذج الإنشاء ── */
  const [showForm, setShowForm] = useState(false);

  /* ── حالات نموذج الاختبار الجديد ── */
  const [formTitle,     setFormTitle]     = useState("");
  const [formLevel,     setFormLevel]     = useState<string>("");
  const [formDate,      setFormDate]      = useState("");  /* تاريخ البدء (datetime-local) */
  const [formEndDate,   setFormEndDate]   = useState("");  /* تاريخ الانتهاء (datetime-local) */
  const [formDuration,  setFormDuration]  = useState<number>(60);
  const [formQuestions, setFormQuestions] = useState<ExamQuestion[]>([emptyQuestion()]);
  const [creating,      setCreating]      = useState(false);
  const [createError,   setCreateError]   = useState<string | null>(null);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  /* ── حساب المدة تلقائياً من تاريخي البدء والانتهاء ── */
  const computedDuration = (() => {
    if (!formDate || !formEndDate) return formDuration;
    const start = new Date(formDate).getTime();
    const end   = new Date(formEndDate).getTime();
    const diff  = Math.round((end - start) / 60000); /* بالدقائق */
    return diff > 0 ? diff : formDuration;
  })();

  /* ── حذف اختبار ── */
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* ── عرض تفاصيل اختبار ── */
  const [viewExam, setViewExam] = useState<Exam | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  /* ── القائمة الجانبية للموبايل ── */
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /* ── جلب ملف المعلم عند التحميل ── */
  useEffect(() => {
    getProfile().then(p => setProfile(p)).catch(() => {});
  }, []);

  /* ── جلب اختبارات المعلم من API مباشرة ── */
  const fetchExams = useCallback(async () => {
    setLoadingExams(true);
    try {
      const data = await getTeacherExams();
      setExams(data);
    } catch {
      setExams([]);
    } finally {
      setLoadingExams(false);
    }
  }, []);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  /* ── تسجيل الخروج ── */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  /* ── إضافة سؤال جديد ── */
  const addQuestion = () =>
    setFormQuestions(prev => [...prev, emptyQuestion()]);

  /* ── حذف سؤال ── */
  const removeQuestion = (idx: number) =>
    setFormQuestions(prev => prev.filter((_, i) => i !== idx));

  /* ── تحديث نص السؤال ── */
  const updateQuestionText = (idx: number, val: string) =>
    setFormQuestions(prev =>
      prev.map((q, i) => (i === idx ? { ...q, question: val } : q))
    );

  /* ── تغيير نوع السؤال ── */
  const updateQuestionType = (idx: number, type: "mcq" | "tf") =>
    setFormQuestions(prev =>
      prev.map((q, i) => {
        if (i !== idx) return q;
        if (type === "tf") return { ...q, type, choices: ["صح", "خطأ"], answer: "" };
        return { ...q, type, choices: ["", "", "", ""], answer: "" };
      })
    );

  /* ── تحديث خيار معيّن ── */
  const updateChoice = (qIdx: number, cIdx: number, val: string) =>
    setFormQuestions(prev =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, choices: q.choices.map((c, ci) => (ci === cIdx ? val : c)) }
          : q
      )
    );

  /* ── إضافة خيار للسؤال ── */
  const addChoice = (qIdx: number) =>
    setFormQuestions(prev =>
      prev.map((q, i) => (i === qIdx ? { ...q, choices: [...q.choices, ""] } : q))
    );

  /* ── حذف خيار ── */
  const removeChoice = (qIdx: number, cIdx: number) =>
    setFormQuestions(prev =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, choices: q.choices.filter((_, ci) => ci !== cIdx), answer: q.answer === q.choices[cIdx] ? "" : q.answer }
          : q
      )
    );

  /* ── تعيين الإجابة الصحيحة ── */
  const setAnswer = (qIdx: number, choice: string) =>
    setFormQuestions(prev =>
      prev.map((q, i) => (i === qIdx ? { ...q, answer: choice } : q))
    );

  /* ── إنشاء الاختبار ── */
  const handleCreate = async () => {
    setCreateError(null);

    /* تحقق بسيط */
    if (!formTitle.trim()) return setCreateError("يرجى كتابة عنوان الاختبار.");
    if (!formDate)         return setCreateError("يرجى تحديد تاريخ ووقت بدء الاختبار.");
    if (!formEndDate)      return setCreateError("يرجى تحديد تاريخ ووقت انتهاء الاختبار.");
    if (computedDuration <= 0) return setCreateError("تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء.");

    /* التحقق من الأسئلة */
    for (let i = 0; i < formQuestions.length; i++) {
      const q = formQuestions[i];
      if (!q.question.trim())
        return setCreateError(`السؤال رقم ${i + 1} فارغ.`);
      if (q.choices.some(c => !c.trim()))
        return setCreateError(`بعض خيارات السؤال رقم ${i + 1} فارغة.`);
      if (!q.answer)
        return setCreateError(`لم تُحدد الإجابة الصحيحة للسؤال رقم ${i + 1}.`);
    }

    setCreating(true);
    try {
      if (editingExamId) {
        /* تحديث الأسئلة على السيرفر عبر API */
        try {
          await addQuestionsToExam(editingExamId, { questions: formQuestions });
        } catch (err) {
          console.error("فشل تحديث الأسئلة:", err);
        }
        /* تحديث القائمة المحلية */
        setExams(prev => prev.map(ex => ex._id === editingExamId ? {
          ...ex,
          title: formTitle.trim(),
          level: formLevel || "",
          startAt: new Date(formDate).toISOString(),
          endAt: formEndDate ? new Date(formEndDate).toISOString() : "",
          duration: computedDuration,
          questions: formQuestions,
        } : ex));
        alert("تم تعديل الاختبار بنجاح!");
      } else {
        /* خطوتان: 1) إنشاء الاختبار  2) إضافة الأسئلة */
        const exam = await createExamWithQuestions(
          {
            title:    formTitle.trim(),
            level:    formLevel || undefined,
            startAt:  new Date(formDate).toISOString(),
            endAt:    formEndDate ? new Date(formEndDate).toISOString() : undefined,
            duration: computedDuration,
          },
          formQuestions,
        );

        /* إضافة الاختبار مباشرة للقائمة */
        setExams(prev => [exam, ...prev]);
      }

      /* إعادة تعيين النموذج */
      setFormTitle("");
      setFormLevel("");
      setFormDate("");
      setFormEndDate("");
      setFormDuration(60);
      setFormQuestions([emptyQuestion()]);
      setEditingExamId(null);
      setShowForm(false);
    } catch (err) {
      setCreateError((err as Error).message || "فشل في حفظ الاختبار.");
    } finally {
      setCreating(false);
    }
  };

  /* ── فتح نموذج التعديل ── */
  const handleEdit = async (examId: string) => {
    try {
      const exam = await getExam(examId);
      if (!exam) return;
      setEditingExamId(examId);
      setFormTitle(exam.title);
      setFormLevel(exam.level || "");
      
      const toDatetimeLocal = (iso?: string) => {
        if (!iso) return "";
        const d = new Date(iso);
        // نعالج التوقيت المحلي
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
      };

      setFormDate(toDatetimeLocal(exam.startAt));
      setFormEndDate(toDatetimeLocal(exam.endAt));
      
      setFormDuration(exam.duration);
      setFormQuestions(exam.questions && exam.questions.length > 0 ? exam.questions : [emptyQuestion()]);
      setShowForm(true);
    } catch {
      alert("فشل في جلب بيانات الاختبار للتعديل.");
    }
  };

  /* ── حذف اختبار ── */
  const handleDelete = async (examId: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الاختبار؟")) return;
    setDeletingId(examId);
    try {
      await deleteExam(examId);
      /* حذف محلي من القائمة */
      setExams(prev => prev.filter(e => e._id !== examId));
    } catch (err) {
      alert((err as Error).message || "فشل في حذف الاختبار.");
    } finally {
      setDeletingId(null);
    }
  };

  /* ── عرض تفاصيل اختبار ── */
  const handleView = async (examId: string) => {
    setViewLoading(true);
    try {
      const exam = await getExam(examId);
      /* getExamResults تُرجع ExamResult[] مباشرة */
      try {
        const results = await getExamResults(examId);
        if (exam) exam.results = results;
      } catch (e) {
        console.error("فشل جلب النتائج", e);
      }
      setViewExam(exam);
    } catch {
      alert("فشل في تحميل الاختبار.");
    } finally {
      setViewLoading(false);
    }
  };

  /* ── دالة مساعدة لتنسيق التاريخ ── */
  const formatDate = (d?: string) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
    } catch { return d; }
  };

  /* ── تسمية المستوى ── */
  const levelLabel = (val?: string) =>
    LEVEL_OPTIONS.find(l => l.value === val)?.label ?? (val || "جميع المستويات");

  return (
    <div className={`min-h-[100dvh] ${tr}`} style={{ backgroundColor: C.page, color: C.textP }} dir="rtl">

      {/* ════ شريط التنقل ════ */}
      <nav
        className={`px-4 sm:px-8 py-3 flex justify-between items-center sticky top-0 z-50 ${tr}`}
        style={{ backgroundColor: C.nav, borderBottom: `1px solid ${C.border}`, boxShadow: C.navShadow }}
      >
        <div className="flex items-center gap-3">
          <Link href="/teacher" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#0A2947] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <ClipboardList className="text-[#A8C8E8] w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight leading-none" style={{ color: C.textP }}>
              بوابة المعلم
            </h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: C.textM }}>إدارة الاختبارات</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block"><ThemeToggle /></div>
          <Link href="/teacher" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-all hover:-translate-y-0.5" style={{ color: C.textS, backgroundColor: C.icon }}>
            <BookOpen className="w-4 h-4" /> لوحة التحكم
          </Link>
          <button onClick={handleLogout} className="hidden sm:flex items-center gap-1.5 text-red-500 hover:text-red-700 font-semibold text-sm transition-colors px-3 py-2 rounded-xl hover:bg-red-50">
            <LogOut className="w-4 h-4" /> خروج
          </button>
          <button className="sm:hidden p-2 rounded-xl hover:bg-black/5 transition-colors" style={{ color: C.textP }} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* قائمة موبايل */}
      {isMobileMenuOpen && (
        <div className="sm:hidden absolute left-0 right-0 top-[65px] z-40 p-4 border-b shadow-lg" style={{ backgroundColor: C.nav, borderColor: C.border }}>
          <div className="flex flex-col gap-3">
            <Link href="/teacher" className="flex items-center gap-3 p-2 rounded-xl hover:bg-black/5" style={{ color: C.textP }} onClick={() => setIsMobileMenuOpen(false)}>
              <BookOpen className="w-5 h-5" />
              <span className="font-semibold text-sm">لوحة التحكم</span>
            </Link>
            <div className="flex items-center gap-3 p-2 rounded-xl" style={{ color: C.textP }}>
              <span className="font-semibold text-sm flex-1">المظهر</span>
              <ThemeToggle />
            </div>
            <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="flex items-center gap-3 p-2 rounded-xl hover:bg-red-50 text-red-500 font-semibold text-sm w-full">
              <LogOut className="w-5 h-5" /><span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* ── لافتة ترحيب ── */}
        <div
          className={`relative rounded-3xl p-6 sm:p-10 text-white mb-8 overflow-hidden shadow-2xl animate-[fadeUp_0.4s_ease-out_both] ${tr}`}
          style={{ backgroundColor: C.hero }}
        >
          <div className="relative z-10">
            <p className="text-[#A8C8E8] text-xs sm:text-sm font-semibold mb-2 tracking-widest uppercase">منصة SMS التعليمية</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 text-[#FFFAF3]">إدارة الاختبارات 📋</h2>
            <p className="text-[#A8C8E8]/90 text-sm mb-5">
              أنشئ اختبارات متعددة الخيارات لأي مستوى دراسي، وأدِر كل اختباراتك من مكان واحد.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-[#FFF2DB] text-[#0A2947] px-6 py-3 rounded-xl font-extrabold hover:bg-white transition-all duration-300 shadow-lg hover:-translate-y-0.5 text-sm"
            >
              <Plus className="w-4 h-4" /> إنشاء اختبار جديد
            </button>
          </div>
          <div className="absolute -left-16 -top-16 w-72 h-72 bg-[#A8C8E8] rounded-full opacity-10 pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#FFF2DB] rounded-full opacity-5 pointer-events-none" />
        </div>

        {/* ════ نموذج إنشاء اختبار جديد (Modal) ════ */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
            <div
              className={`w-full max-w-2xl mx-4 rounded-3xl p-6 sm:p-8 shadow-2xl animate-[fadeUp_0.3s_ease-out_both] ${tr}`}
              style={{ backgroundColor: C.card, border: `2px solid ${C.border}` }}
            >
              {/* رأس النموذج */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-extrabold" style={{ color: C.textP }}>
                    {editingExamId ? "تعديل الاختبار" : "إنشاء اختبار جديد"}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: C.textM }}>
                    {editingExamId ? "عدّل بيانات الاختبار وأسئلته بحرية" : "أضف الأسئلة وحدد المستوى والتوقيت"}
                  </p>
                </div>
                <button onClick={() => { setShowForm(false); setCreateError(null); setEditingExamId(null); }} className="p-2 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* حقول أساسية */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                {/* عنوان الاختبار */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1.5" style={{ color: C.textM }}>عنوان الاختبار *</label>
                  <input
                    type="text"
                    placeholder="مثال: اختبار نصف الفصل — رياضيات"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all"
                    style={{ backgroundColor: C.input, border: `2px solid ${C.border}`, color: C.textP }}
                    onFocus={e => (e.target.style.borderColor = C.borderA)}
                    onBlur={e => (e.target.style.borderColor = C.border)}
                  />
                </div>

                {/* المستوى الدراسي */}
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: C.textM }}>المستوى الدراسي</label>
                  <div className="relative">
                    <ChevronDown className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 pointer-events-none" style={{ color: C.textM }} />
                    <select
                      value={formLevel}
                      onChange={e => setFormLevel(e.target.value)}
                      className="appearance-none w-full pr-4 pl-9 py-3 rounded-2xl text-sm font-semibold outline-none cursor-pointer"
                      style={{ backgroundColor: C.input, border: `2px solid ${C.border}`, color: C.textP }}
                      onFocus={e => (e.target.style.borderColor = C.borderA)}
                      onBlur={e => (e.target.style.borderColor = C.border)}
                    >
                      <option value="">جميع المستويات</option>
                      {LEVEL_OPTIONS.map(l => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* تاريخ ووقت البدء */}
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: C.textM }}>تاريخ ووقت البدء *</label>
                  <input
                    type="datetime-local"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all"
                    style={{ backgroundColor: C.input, border: `2px solid ${C.border}`, color: C.textP }}
                    onFocus={e => (e.target.style.borderColor = C.borderA)}
                    onBlur={e  => (e.target.style.borderColor = C.border)}
                  />
                </div>

                {/* تاريخ ووقت الانتهاء */}
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: C.textM }}>تاريخ ووقت الانتهاء *</label>
                  <input
                    type="datetime-local"
                    value={formEndDate}
                    min={formDate || undefined}
                    onChange={e => setFormEndDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all"
                    style={{ backgroundColor: C.input, border: `2px solid ${C.border}`, color: C.textP }}
                    onFocus={e => (e.target.style.borderColor = C.borderA)}
                    onBlur={e  => (e.target.style.borderColor = C.border)}
                  />
                </div>

                {/* المدة المحسوبة تلقائياً */}
                {formDate && formEndDate && computedDuration > 0 && (
                  <div className="sm:col-span-2 flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ backgroundColor: "rgba(168,200,232,0.15)", border: `1.5px solid rgba(168,200,232,0.4)` }}>
                    <Clock className="w-4 h-4" style={{ color: "#0A2947" }} />
                    <span className="text-sm font-bold" style={{ color: "#0A2947" }}>مدة الاختبار: {computedDuration} دقيقة</span>
                  </div>
                )}
              </div>

              {/* ── قسم الأسئلة ── */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-extrabold text-sm" style={{ color: C.textP }}>الأسئلة ({formQuestions.length})</h4>
                  <button
                    onClick={addQuestion}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5"
                    style={{ backgroundColor: "rgba(168,200,232,0.2)", color: "#0A2947" }}
                  >
                    <Plus className="w-3.5 h-3.5" /> إضافة سؤال
                  </button>
                </div>

                <div className="flex flex-col gap-5 max-h-[50vh] overflow-y-auto pl-1">
                  {formQuestions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="rounded-2xl p-4"
                      style={{ backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(10,41,71,0.04)", border: `1.5px solid ${C.border}` }}
                    >
                      {/* رأس السؤال */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-extrabold px-2 py-1 rounded-lg" style={{ backgroundColor: "#0A2947", color: "#A8C8E8" }}>
                          سؤال {qIdx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <select
                            value={q.type || "mcq"}
                            onChange={e => updateQuestionType(qIdx, e.target.value as "mcq" | "tf")}
                            className="text-xs font-bold px-2 py-1 rounded-lg outline-none cursor-pointer"
                            style={{ backgroundColor: C.input, color: C.textP, border: `1px solid ${C.border}` }}
                          >
                            <option value="mcq">اختيار من متعدد</option>
                            <option value="tf">صح أو خطأ</option>
                          </select>
                          {formQuestions.length > 1 && (
                            <button onClick={() => removeQuestion(qIdx)} className="p-1 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* نص السؤال */}
                      <textarea
                        placeholder="اكتب نص السؤال..."
                        value={q.question}
                        onChange={e => updateQuestionText(qIdx, e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl text-sm font-medium outline-none transition-all resize-none mb-3"
                        style={{ backgroundColor: C.input, border: `2px solid ${C.border}`, color: C.textP }}
                        onFocus={e => (e.target.style.borderColor = C.borderA)}
                        onBlur={e => (e.target.style.borderColor = C.border)}
                      />

                      {/* الخيارات */}
                      <div className="flex flex-col gap-2 mb-2">
                        <p className="text-xs font-bold" style={{ color: C.textM }}>
                          الخيارات <span style={{ color: "#16a34a" }}>(انقر على الصح لتحديد الإجابة الصحيحة)</span>
                        </p>
                        {q.choices.map((choice, cIdx) => (
                          <div key={cIdx} className="flex items-center gap-2">
                            {/* زر الإجابة الصحيحة */}
                            <button
                              onClick={() => setAnswer(qIdx, choice)}
                              className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${q.answer === choice && choice !== "" ? "bg-green-500 border-green-500" : "border-gray-300"}`}
                              title="تحديد كإجابة صحيحة"
                              type="button"
                            >
                              {q.answer === choice && choice !== "" && <Check className="w-3 h-3 text-white" />}
                            </button>

                            <input
                              type="text"
                              placeholder={`الخيار ${cIdx + 1}`}
                              value={choice}
                              onChange={e => updateChoice(qIdx, cIdx, e.target.value)}
                              disabled={q.type === "tf"}
                              className="flex-1 px-3 py-2 rounded-xl text-sm font-medium outline-none transition-all disabled:opacity-80 disabled:cursor-not-allowed"
                              style={{ backgroundColor: C.input, border: `2px solid ${q.answer === choice && choice ? "rgba(34,197,94,0.5)" : C.border}`, color: C.textP }}
                              onFocus={e => (e.target.style.borderColor = C.borderA)}
                              onBlur={e => (e.target.style.borderColor = q.answer === choice && choice ? "rgba(34,197,94,0.5)" : C.border)}
                            />

                            {/* حذف خيار */}
                            {q.choices.length > 2 && q.type !== "tf" && (
                              <button onClick={() => removeChoice(qIdx, cIdx)} className="shrink-0 p-1 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}

                        {/* إضافة خيار */}
                        {q.choices.length < 6 && q.type !== "tf" && (
                          <button onClick={() => addChoice(qIdx)} className="flex items-center gap-1 text-xs font-bold mt-1 transition-colors hover:opacity-70" style={{ color: C.textM }}>
                            <Plus className="w-3.5 h-3.5" /> إضافة خيار
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* رسالة الخطأ */}
              {createError && (
                <div className="rounded-2xl p-3 mb-4 flex items-center gap-2" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.25)" }}>
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-red-600 text-xs font-semibold">{createError}</p>
                </div>
              )}

              {/* أزرار */}
              <div className="flex gap-3">
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-extrabold text-sm transition-all hover:-translate-y-0.5 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#0A2947", color: "#A8C8E8" }}
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingExamId ? (
                    <Pencil className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {creating ? "جارٍ الحفظ..." : editingExamId ? "حفظ التعديلات" : "إنشاء الاختبار"}
                </button>
                <button
                  onClick={() => { setShowForm(false); setCreateError(null); setEditingExamId(null); }}
                  disabled={creating}
                  className="px-5 py-3 rounded-2xl font-bold text-sm transition-all"
                  style={{ backgroundColor: C.icon, color: C.textS }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════ نافذة تفاصيل الاختبار ════ */}
        {viewExam && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
            <div className={`w-full max-w-2xl mx-4 rounded-3xl p-6 sm:p-8 shadow-2xl animate-[fadeUp_0.3s_ease-out_both] ${tr}`} style={{ backgroundColor: C.card, border: `2px solid ${C.border}` }}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-xl font-extrabold" style={{ color: C.textP }}>{viewExam.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2.5 py-1 rounded-xl font-bold" style={{ backgroundColor: "rgba(168,200,232,0.2)", color: "#0A2947" }}>
                      كود الاختبار: <span className="font-mono tracking-widest">{viewExam._id}</span>
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(viewExam._id as string);
                        alert("تم نسخ الكود! شاركه مع طلابك.");
                      }}
                      className="p-1 rounded-md hover:bg-black/10 transition-colors"
                      title="نسخ الكود"
                    >
                      <Copy className="w-4 h-4" style={{ color: C.textM }} />
                    </button>
                  </div>
                </div>
                <button onClick={() => setViewExam(null)} className="p-2 rounded-xl hover:bg-black/10 transition-colors" style={{ color: C.textM }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* معلومات الاختبار */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: C.icon }}>
                  <Calendar className="w-4 h-4 mx-auto mb-1" style={{ color: C.textM }} />
                  <p className="text-xs font-bold" style={{ color: C.textP }}>{formatDate(viewExam.startAt)}</p>
                  <p className="text-xs" style={{ color: C.textM }}>تاريخ البدء</p>
                </div>
                {viewExam.endAt && (
                  <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: "rgba(239,68,68,0.07)", border: "1.5px solid rgba(239,68,68,0.2)" }}>
                    <Calendar className="w-4 h-4 mx-auto mb-1" style={{ color: "#dc2626" }} />
                    <p className="text-xs font-bold" style={{ color: "#dc2626" }}>{formatDate(viewExam.endAt)}</p>
                    <p className="text-xs" style={{ color: "#dc2626" }}>تاريخ الانتهاء</p>
                  </div>
                )}
                <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: C.icon }}>
                  <Clock className="w-4 h-4 mx-auto mb-1" style={{ color: C.textM }} />
                  <p className="text-xs font-bold" style={{ color: C.textP }}>{viewExam.duration} دقيقة</p>
                  <p className="text-xs" style={{ color: C.textM }}>المدة</p>
                </div>
                <div className="rounded-2xl p-3 text-center flex flex-col items-center justify-center relative" style={{ backgroundColor: C.icon }}>
                  <GraduationCap className="w-4 h-4 mx-auto mb-1" style={{ color: C.textM }} />
                  <p className="text-xs font-bold" style={{ color: C.textP }}>{levelLabel(viewExam.level)}</p>
                  <p className="text-xs mt-1" style={{ color: C.textM }}>المستوى</p>
                </div>
              </div>

              {/* قائمة الأسئلة */}
              <h4 className="font-extrabold text-sm mb-3" style={{ color: C.textP }}>
                الأسئلة ({viewExam.questions?.length || 0})
              </h4>
              {!viewExam.questions || viewExam.questions.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: C.textM }}>لا توجد أسئلة في هذا الاختبار.</p>
              ) : (
                <div className="flex flex-col gap-4 max-h-[40vh] overflow-y-auto pl-1 mb-6">
                  {viewExam.questions.map((q, i) => (
                    <div key={i} className="rounded-2xl p-4" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(10,41,71,0.04)", border: `1.5px solid ${C.border}` }}>
                      <p className="font-bold text-sm mb-3 flex items-center justify-between" style={{ color: C.textP }}>
                        <span>
                          <span className="text-xs px-2 py-0.5 rounded-lg ml-2 font-extrabold" style={{ backgroundColor: "#0A2947", color: "#A8C8E8" }}>{i + 1}</span>
                          {q.question}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: C.icon, color: C.textM }}>
                          {q.type === "tf" ? "صح/خطأ" : "اختيار من متعدد"}
                        </span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.choices.map((c, ci) => (
                          <div key={ci} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ backgroundColor: c === q.answer ? "rgba(34,197,94,0.12)" : C.input, border: `1.5px solid ${c === q.answer ? "rgba(34,197,94,0.4)" : C.border}`, color: c === q.answer ? "#16a34a" : C.textP }}>
                            {c === q.answer && <Check className="w-3.5 h-3.5 shrink-0" />}
                            <span className={c === q.answer ? "font-bold" : ""}>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* قائمة نتائج الطلاب من API */}
              <h4 className="font-extrabold text-sm mb-3 border-t pt-4" style={{ color: C.textP, borderColor: C.border }}>
                نتائج الطلاب ({viewExam.results?.length || 0})
              </h4>
              {!viewExam.results || viewExam.results.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: C.textM }}>لم يقم أي طالب بإجراء الاختبار بعد.</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto pl-1">
                  {/* ترتيب النتائج حسب الدرجة الأعلى */}
                  {[...viewExam.results].sort((a, b) => b.score - a.score).map((r, i) => {
                    /* اسم الطالب قد يكون في studentName أو داخل studentId إذا كان كائن */
                    const name = r.studentName ||
                      (typeof r.studentId === "object" ? (r.studentId as any)?.fullName || (r.studentId as any)?.userName : r.studentId) ||
                      "طالب";
                    return (
                      <div key={r._id || i} className="flex items-center justify-between p-3 rounded-2xl" style={{ backgroundColor: C.input, border: `1px solid ${C.border}` }}>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm" style={{ color: C.textP }}>{String(name)}</span>
                          {r.submittedAt && <span className="text-xs mt-0.5" style={{ color: C.textM }}>{new Date(r.submittedAt).toLocaleString("ar-EG")}</span>}
                        </div>
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl font-extrabold text-lg shadow-sm" style={{ backgroundColor: r.score >= (r.total / 2) ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: r.score >= (r.total / 2) ? "#16a34a" : "#dc2626" }}>
                          {r.score}/{r.total}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ قائمة الاختبارات ════ */}
        <div className="animate-[fadeUp_0.5s_ease-out_both]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-extrabold" style={{ color: C.textP }}>اختباراتي ({exams.length})</h3>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 shadow-md"
              style={{ backgroundColor: "#0A2947", color: "#A8C8E8" }}
            >
              <Plus className="w-4 h-4" /> اختبار جديد
            </button>
          </div>

          {loadingExams ? (
            <div className="flex flex-col items-center py-20">
              <Loader2 className="w-12 h-12 animate-spin mb-3" style={{ color: "#A8C8E8" }} />
              <p style={{ color: C.textM }}>جارٍ تحميل الاختبارات...</p>
            </div>
          ) : exams.length === 0 ? (
            <div className="flex flex-col items-center py-20">
              <HelpCircle className="w-16 h-16 mb-4 opacity-20" style={{ color: C.textM }} />
              <p className="text-lg font-bold mb-1" style={{ color: C.textS }}>لا توجد اختبارات حتى الآن</p>
              <p className="text-sm mb-5" style={{ color: C.textM }}>ابدأ بإنشاء أول اختبار لطلابك!</p>
              <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition-all hover:-translate-y-0.5" style={{ backgroundColor: "#0A2947", color: "#A8C8E8" }}>
                <Plus className="w-4 h-4" /> إنشاء اختبار جديد
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {exams.map((exam, idx) => {
                if (!exam) return null;
                const isDeleting = deletingId === exam._id;
                return (
                  <div
                    key={exam._id}
                    className={`rounded-3xl p-5 ${tr} animate-[fadeUp_0.45s_ease-out_both]`}
                    style={{ backgroundColor: C.card, border: `2px solid ${C.border}`, boxShadow: C.cardSh, animationDelay: `${idx * 0.05}s` }}
                  >
                    {/* رأس البطاقة */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-base leading-snug truncate" style={{ color: C.textP }}>{exam.title}</h4>
                        <div className="flex flex-col gap-1.5 mt-2">
                          <span className="inline-block self-start text-xs px-2.5 py-1 rounded-xl font-bold" style={{ backgroundColor: "rgba(168,200,232,0.2)", color: "#0A2947" }}>
                            {levelLabel(exam.level)}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl self-start" style={{ backgroundColor: C.input, border: `1px solid ${C.border}`, color: C.textS }}>
                            <span className="font-mono tracking-widest">{exam._id}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(exam._id as string);
                                alert("تم نسخ الكود بنجاح! أرسله للطلاب ليدخلوا به.");
                              }}
                              className="hover:text-[#A8C8E8] transition-colors"
                              title="نسخ الكود"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      {/* أزرار الإجراء */}
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await activeExam(exam._id as string);
                            alert("تم تغيير حالة الاختبار (تفعيل / إيقاف) بنجاح!");
                          } catch (err) {
                            alert((err as Error).message || "فشل في تغيير حالة الاختبار.");
                          }
                        }} className="p-2 rounded-xl transition-all hover:scale-110" style={{ backgroundColor: "rgba(234,179,8,0.1)", color: "#eab308" }} title="تفعيل / إيقاف الاختبار">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleView(exam._id as string)} disabled={viewLoading} className="p-2 rounded-xl transition-all hover:scale-110" style={{ backgroundColor: "rgba(168,200,232,0.15)", color: "#0A2947" }} title="عرض التفاصيل">
                          {viewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleEdit(exam._id as string)} className="p-2 rounded-xl transition-all hover:scale-110" style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#16a34a" }} title="تعديل الاختبار">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(exam._id as string)} disabled={isDeleting} className="p-2 rounded-xl transition-all hover:scale-110 disabled:opacity-60" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#dc2626" }} title="حذف الاختبار">
                          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* معلومات الاختبار */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl p-2 text-center" style={{ backgroundColor: C.icon }}>
                        <Clock className="w-3.5 h-3.5 mx-auto mb-0.5" style={{ color: C.textM }} />
                        <p className="text-xs font-bold" style={{ color: C.textP }}>{exam.duration}د</p>
                      </div>
                      <div className="rounded-xl p-2 text-center" style={{ backgroundColor: C.icon }}>
                        <HelpCircle className="w-3.5 h-3.5 mx-auto mb-0.5" style={{ color: C.textM }} />
                        <p className="text-xs font-bold" style={{ color: C.textP }}>{exam.questions.length} سؤال</p>
                      </div>
                      <div className="rounded-xl p-2 text-center" style={{ backgroundColor: C.icon }}>
                        <Calendar className="w-3.5 h-3.5 mx-auto mb-0.5" style={{ color: C.textM }} />
                        <p className="text-xs font-bold truncate" style={{ color: C.textP }}>{new Date(exam.startAt).toLocaleDateString("ar-EG")}</p>
                        <p className="text-xs" style={{ color: C.textM }}>بدء</p>
                      </div>
                      {exam.endAt && (
                        <div className="rounded-xl p-2 text-center" style={{ backgroundColor: "rgba(239,68,68,0.07)", border: "1.5px solid rgba(239,68,68,0.2)" }}>
                          <Calendar className="w-3.5 h-3.5 mx-auto mb-0.5" style={{ color: "#dc2626" }} />
                          <p className="text-xs font-bold truncate" style={{ color: "#dc2626" }}>{new Date(exam.endAt).toLocaleDateString("ar-EG")}</p>
                          <p className="text-xs" style={{ color: "#dc2626" }}>انتهاء</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
