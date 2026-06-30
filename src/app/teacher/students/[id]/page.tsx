"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   src/app/teacher/students/[id]/page.tsx
   صفحة تفاصيل الطالب (للمعلم فقط)

   الميزات:
   - عرض وتعديل بيانات الطالب (الاسم الكامل، رقم الهاتف، المستوى)
   - إمكانية حذف الطالب نهائياً
   - دعم الوضع الليلي + RTL
───────────────────────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  User, Mail, Phone, BookOpen, Calendar, ArrowRight,
  GraduationCap, LogOut, AlertTriangle, AlertCircle,
  CheckCircle2, RefreshCw, Save, Trash2, Shield
} from "lucide-react";
import { getStudent, updateStudent, deleteStudent, Student, LEVEL_OPTIONS } from "@/lib/api/students";
import { useTheme } from "@/components/ThemeProvider";
import { getColors, ThemeColors } from "@/lib/theme/colors";
import ThemeToggle from "@/components/ThemeToggle";

/* ── مساعدات ── */
const getInitial    = (p: Student) => (p.fullName || p.name || p.userName || "ط").charAt(0).toUpperCase();
const getDisplayName = (p: Student) => p.fullName || p.name || p.userName || "مستخدم غير معروف";
const formatDate    = (d?: string) => {
  if (!d) return "—";
  try { return new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "long", day: "numeric" }).format(new Date(d)); }
  catch { return d; }
};
const getRoleLabel = (r?: string) =>
  ({ student: "طالب", teacher: "معلم", admin: "مدير", instructor: "مدرّس" }[r?.toLowerCase() ?? ""] ?? (r || "مستخدم"));

/* ════════════════════════════════════════════════════════════════════════════
   المكوّن الرئيسي
════════════════════════════════════════════════════════════════════════════ */
export default function StudentDetailsPage() {
  const router       = useRouter();
  const params       = useParams();
  const studentId    = params.id as string;
  const { isDark }   = useTheme();
  const C            = getColors(isDark);
  const tr           = "transition-all duration-300 ease-in-out";

  /* ── حالة البيانات ── */
  const [student, setStudent]                 = useState<Student | null>(null);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState("");

  /* ── حالة التعديل ── */
  const [editFullName, setEditFullName]       = useState("");
  const [editPhone, setEditPhone]             = useState("");
  const [editLevel, setEditLevel]             = useState("");
  const [submitting, setSubmitting]           = useState(false);
  const [success, setSuccess]                 = useState("");
  const [formError, setFormError]             = useState("");

  /* ── حالة الحذف ── */
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting]               = useState(false);
  const [deleteError, setDeleteError]         = useState("");

  /* ── جلب بيانات الطالب ── */
  const fetchStudentData = useCallback(async () => {
    if (!studentId) return;
    setLoading(true); setError(""); setSuccess("");
    try {
      const data = await getStudent(studentId);
      setStudent(data);
      setEditFullName(data.fullName || data.name || "");
      setEditPhone(data.phoneNumber || data.phone || "");
      setEditLevel(data.level || "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع في جلب بيانات الطالب.");
    } finally { setLoading(false); }
  }, [studentId]);

  useEffect(() => { fetchStudentData(); }, [fetchStudentData]);

  /* ── تسجيل الخروج ── */
  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.push("/auth/login"); };

  /* ── تحديث البيانات ── */
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(""); setSuccess("");
    
    // Validate
    if (editPhone && !/^[\d+\-\s()]{7,20}$/.test(editPhone)) {
      setFormError("رقم الهاتف غير صالح.");
      return;
    }

    const payload: Record<string, string> = {};
    if (editFullName.trim()) payload.fullName = editFullName.trim();
    if (editPhone.trim())    payload.phoneNumber = editPhone.trim();
    if (editLevel)           payload.level = editLevel;

    if (!Object.keys(payload).length) {
      setFormError("لا توجد بيانات لتحديثها.");
      return;
    }

    setSubmitting(true);
    try {
      const updated = await updateStudent(studentId, payload);
      setStudent(updated);
      setSuccess("تم تحديث بيانات الطالب بنجاح!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "فشل في تحديث بيانات الطالب.");
    } finally { setSubmitting(false); }
  };

  /* ── حذف الطالب ── */
  const handleDelete = async () => {
    setDeleting(true); setDeleteError("");
    try {
      await deleteStudent(studentId);
      router.push("/teacher/students"); // العودة للقائمة بعد الحذف
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "فشل في حذف الطالب.");
      setDeleting(false);
    }
  };

  /* ── حالة التحميل ── */
  if (loading) return (
    <div className={`min-h-[100dvh] flex items-center justify-center ${tr}`} style={{ backgroundColor: C.page }} dir="rtl">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-[#A8C8E8]/30 border-t-[#0A2947] animate-spin" />
        <p className="font-semibold" style={{ color: C.textP }}>جارٍ تحميل بيانات الطالب…</p>
      </div>
    </div>
  );

  /* ── حالة الخطأ ── */
  if (error && !student) return (
    <div className={`min-h-[100dvh] flex items-center justify-center px-4 ${tr}`} style={{ backgroundColor: C.page }} dir="rtl">
      <div className="rounded-3xl p-8 max-w-sm w-full text-center shadow-xl" style={{ backgroundColor: C.card, border: `2px solid ${C.border}` }}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-lg font-extrabold mb-2" style={{ color: C.textP }}>تعذّر التحميل</h2>
        <p className="text-sm mb-6" style={{ color: C.textM }}>{error}</p>
        <div className="flex gap-2 flex-col">
          <button onClick={fetchStudentData} className="w-full bg-[#0A2947] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#0d365e] transition-colors">
            <RefreshCw className="w-4 h-4" /> إعادة المحاولة
          </button>
          <Link href="/teacher/students" className="w-full border border-gray-300 py-3 rounded-xl font-bold text-sm text-center" style={{ color: C.textP }}>
            العودة لقائمة الطلاب
          </Link>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════ الواجهة الرئيسية ══════════════════════ */
  return (
    <div className={`min-h-[100dvh] ${tr}`} style={{ backgroundColor: C.page, color: C.textP }} dir="rtl">

      {/* ══════════ navbar ══════════ */}
      <nav
        className={`px-4 sm:px-8 py-3 flex justify-between items-center sticky top-0 z-50 ${tr}`}
        style={{ backgroundColor: C.nav, borderBottom: `1px solid ${C.border}`, boxShadow: C.navShadow }}
      >
        <Link href="/teacher/students" className="flex items-center gap-2 font-semibold text-sm group" style={{ color: C.textP }}>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /> إدارة الطلاب
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#0A2947] flex items-center justify-center shadow-md">
            <GraduationCap className="text-[#A8C8E8] w-5 h-5" />
          </div>
          <span className="font-extrabold hidden sm:block" style={{ color: C.textP }}>تفاصيل الطالب</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-red-500 hover:text-red-700 font-semibold text-sm transition-colors px-3 py-2 rounded-xl hover:bg-red-50">
            <LogOut className="w-4 h-4" /><span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </nav>

      {/* ══════════ المحتوى ══════════ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-[fadeUp_0.4s_ease-out_both]">

        {/* ── بطاقة رأس الملف ── */}
        <div
          className={`relative rounded-3xl p-6 sm:p-10 text-white mb-6 overflow-hidden shadow-2xl ${tr}`}
          style={{ backgroundColor: C.hero }}
        >
          <div className="absolute -left-16 -top-16 w-64 h-64 bg-[#A8C8E8] rounded-full opacity-10 pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#FFF2DB] rounded-full opacity-5 pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#A8C8E8] flex items-center justify-center text-[#0A2947] font-extrabold text-4xl shadow-xl shrink-0 select-none border-4 border-white/20">
              {student ? getInitial(student) : "ط"}
            </div>

            <div className="text-center sm:text-right flex-1">
              <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start w-full">
                <div>
                  {student?.role && (
                    <span className="bg-[#A8C8E8]/20 border border-[#A8C8E8]/40 text-[#A8C8E8] text-xs font-bold px-3 py-1 rounded-full inline-block mb-2">
                      {getRoleLabel(student.role)}
                    </span>
                  )}
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FFFAF3]">
                    {student ? getDisplayName(student) : "—"}
                  </h1>
                  {student?.userName && <p className="text-[#A8C8E8]/80 text-sm mt-1 font-mono">@{student.userName}</p>}
                </div>

                <div className="mt-4 sm:mt-0 text-left">
                  <button onClick={() => setShowDeleteModal(true)} className="flex items-center justify-center gap-2 bg-red-500/10 border border-red-400/30 text-red-300 hover:bg-red-500/20 hover:text-red-200 px-4 py-2 rounded-xl font-bold text-sm transition-all w-full sm:w-auto text-center cursor-pointer">
                    <Trash2 className="w-4 h-4" /> حذف الطالب
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-4 justify-center sm:justify-start">
                {student?.level && (
                  <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg">
                    <BookOpen className="w-4 h-4 text-[#A8C8E8]" />
                    <span className="text-sm font-medium">المستوى: {student.level}</span>
                  </div>
                )}
                {student?.email && (
                  <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg" dir="ltr">
                    <Mail className="w-4 h-4 text-[#A8C8E8]" />
                    <span className="text-sm font-medium">{student.email}</span>
                  </div>
                )}
                {student?.createdAt && (
                  <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg">
                    <Calendar className="w-4 h-4 text-[#A8C8E8]" />
                    <span className="text-sm font-medium">انضم: {formatDate(student.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── نموذج تعديل البيانات ── */}
        <div className={`rounded-3xl p-6 sm:p-8 shadow-xl ${tr}`} style={{ backgroundColor: C.card, border: `2px solid ${C.border}` }}>
          <h2 className="text-lg font-extrabold mb-6 border-r-4 border-[#A8C8E8] pr-3 py-0.5" style={{ color: C.textP }}>
            تعديل بيانات الطالب
          </h2>

          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-6 text-sm font-medium animate-[fadeUp_0.25s_ease-out]">
              <CheckCircle2 className="w-4 h-4 shrink-0" /><span>{success}</span>
            </div>
          )}

          {formError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm font-medium animate-[fadeUp_0.25s_ease-out]">
              <AlertCircle className="w-4 h-4 shrink-0" /><span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField C={C} id="edit-fullname" label="الاسم الكامل" icon={User} value={editFullName} onChange={setEditFullName} placeholder="الاسم الكامل للطالب" />
            <FormField C={C} id="edit-phone" label="رقم الهاتف" icon={Phone} value={editPhone} onChange={setEditPhone} placeholder="رقم الهاتف" type="tel" ltr />
            
            {/* المستوى */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-level" className="text-xs sm:text-sm font-semibold" style={{ color: C.textP }}>المستوى الدراسي</label>
              <div className="relative group">
                <BookOpen className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.textM }} />
                <select
                  id="edit-level"
                  value={editLevel}
                  onChange={e => setEditLevel(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 rounded-xl text-sm outline-none transition-all duration-300 focus:shadow-[0_0_0_4px_rgba(168,200,232,0.35)] appearance-none cursor-pointer"
                  style={{ backgroundColor: C.input, color: C.textP, border: `2px solid ${C.border}` }}
                >
                  <option value="" disabled>اختر المستوى</option>
                  {LEVEL_OPTIONS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-2 mt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0A2947] text-[#FFFAF3] font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:bg-[#0d365e] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(10,41,71,0.3)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-[#A8C8E8]/30 border-t-[#A8C8E8] rounded-full animate-spin" /> جارٍ الحفظ…</>
                  : <><Save className="w-4 h-4" /> حفظ التعديلات</>
                }
              </button>
            </div>
          </form>
        </div>

      </main>

      {/* ══════════ Modal الحذف ══════════ */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
          onClick={e => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}
        >
          <div className="rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-[scaleIn_0.2s_ease-out]"
               style={{ backgroundColor: C.card, border: `2px solid ${C.border}` }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-extrabold text-center mb-2" style={{ color: C.textP }}>حذف الطالب نهائياً</h2>
            <p className="text-sm text-center mb-6 leading-relaxed" style={{ color: C.textM }}>
              هل أنت متأكد من حذف حساب الطالب <strong style={{ color: C.textP }}>{student?.fullName || student?.name || student?.userName}</strong>؟ سيتم مسح جميع بياناته ولا يمكن التراجع.
            </p>
            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-4 py-3 mb-4 font-medium">{deleteError}</div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteError(""); }}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                style={{ border: `2px solid ${C.border}`, color: C.textP, backgroundColor: C.card }}
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? "جارٍ الحذف…" : "نعم، احذف"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── FormField — حقل نصي مع دعم الثيم ── */
function FormField({ C, id, label, icon: Icon, value, onChange, placeholder, type = "text", ltr = false }: {
  C: ThemeColors; id: string; label: string; icon: React.ElementType; value: string;
  onChange: (v: string) => void; placeholder?: string; type?: string; ltr?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs sm:text-sm font-semibold" style={{ color: C.textP }}>{label}</label>
      <div className="relative group">
        <Icon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.textM }} />
        <input
          id={id} type={type} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          className={`w-full pr-10 pl-4 py-3 rounded-xl text-sm outline-none transition-all duration-300 focus:shadow-[0_0_0_4px_rgba(168,200,232,0.35)]`}
          style={{ backgroundColor: C.input, color: C.textP, border: `2px solid ${C.border}` }}
          dir={ltr ? "ltr" : "rtl"}
        />
      </div>
    </div>
  );
}
