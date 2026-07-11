"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   src/app/teacher/attendance/page.tsx
   صفحة تسجيل الحضور — خاصة بالمعلم

   الميزات:
   - اختيار التاريخ وتسجيل حضور الطلاب
   - عرض الطلاب مع حالات الحضور (حاضر، غائب، متأخر، معذور)
   - حفظ سجل الحضور
   - دعم الوضع الليلي + RTL + اللغة العربية
───────────────────────────────────────────────────────────────────────────── */

import {
  Users, Search, GraduationCap, LogOut, ChevronLeft,
  Check, X, AlertCircle, Loader2, RefreshCw,
  BookOpen, Menu, ChevronDown, Calendar, CheckCircle2,
  XCircle, Clock, AlertTriangle
, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { getProfile, UserProfile } from "@/lib/api/user";
import { getStudents, getStudentsByLevel, LEVEL_OPTIONS, Student } from "@/lib/api/students";
import { getAttendance, recordAttendance, updateAttendance, AttendanceRecord } from "@/lib/api/attendance";
import { useTheme } from "@/components/ThemeProvider";
import { getColors } from "@/lib/theme/colors";
import ThemeToggle from "@/components/ThemeToggle";

const ATTENDANCE_STATUS = [
  { value: "present", label: "حاضر", icon: CheckCircle2, color: "#16a34a", bg: "rgba(34,197,94,0.12)" },
  { value: "absent", label: "غائب", icon: XCircle, color: "#dc2626", bg: "rgba(239,68,68,0.12)" },
  { value: "late", label: "متأخر", icon: Clock, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  { value: "excused", label: "معذور", icon: AlertTriangle, color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
] as const;

export default function TeacherAttendancePage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, string>>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tr = "transition-all duration-300 ease-in-out";

  useEffect(() => {
    getProfile().then(p => setProfile(p)).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [studentsData, attendanceData] = await Promise.all([
          levelFilter === "all" ? getStudents() : getStudentsByLevel(levelFilter),
          getAttendanceByDate(selectedDate)
        ]);
        setStudents(studentsData);
        setAttendance(attendanceData);

        // Initialize attendance status from existing records
        const statusMap: Record<string, string> = {};
        attendanceData.forEach(record => {
          if (record.studentId) {
            statusMap[String(record.studentId)] = record.status || "absent";
          }
        });
        setAttendanceStatus(statusMap);
      } catch (err) {
        setError((err as Error).message || "فشل في تحميل البيانات.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [levelFilter, selectedDate]);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsData, attendanceData] = await Promise.all([
        levelFilter === "all" ? getStudents() : getStudentsByLevel(levelFilter),
        getAttendanceByDate(selectedDate)
      ]);
      setStudents(studentsData);
      setAttendance(attendanceData);

      const statusMap: Record<string, string> = {};
      attendanceData.forEach(record => {
        if (record.studentId) {
          statusMap[String(record.studentId)] = record.status || "absent";
        }
      });
      setAttendanceStatus(statusMap);
    } catch (err) {
      setError((err as Error).message || "فشل في تحميل البيانات.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceStatus(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      for (const student of students) {
        const id = String(student._id ?? student.id);
        const status = attendanceStatus[id] || "absent";
        
        // Check if record already exists
        const existingRecord = attendance.find(r => String(r.studentId) === id);
        
        if (existingRecord) {
          await updateAttendance(existingRecord.id || id, status as "present" | "absent" | "late" | "excused");
        } else {
          await recordAttendance(id, status as any, selectedDate);
        }
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Refresh attendance data
      const updatedAttendance = await getAttendanceByDate(selectedDate);
      setAttendance(updatedAttendance);
    } catch (err) {
      setError("فشل في حفظ سجل الحضور. يرجى المحاولة مرة أخرى.");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAllPresent = () => {
    const newStatus: Record<string, string> = {};
    students.forEach(student => {
      const id = String(student._id ?? student.id);
      newStatus[id] = "present";
    });
    setAttendanceStatus(newStatus);
  };

  const displayName = (s: Student) =>
    s.fullName ?? s.name ?? s.userName ?? "—";

  const levelLabel = (val?: string) =>
    LEVEL_OPTIONS.find(l => l.value === val)?.label ?? (val ?? "—");

  const initial = (s: Student) =>
    (displayName(s)).charAt(0).toUpperCase();

  const filtered = useMemo(() => {
    return students.filter(s => {
      if (!searchQuery) return true;
      return displayName(s).toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [students, searchQuery]);

  const avatarColors = [
    "#0A2947", "#1a4a7a", "#2d6b9e", "#3d8ec2",
    "#1e5f8e", "#0e3b63", "#264d73",
  ];
  const avatarColor = (idx: number) => avatarColors[idx % avatarColors.length];

  const getStatusBadge = (status?: string) => {
    const option = ATTENDANCE_STATUS.find(s => s.value === status);
    if (!option) return { text: "غير مسجل", bg: "rgba(156,163,175,0.12)", col: "#6b7280", border: "rgba(156,163,175,0.4)" };
    return { text: option.label, bg: option.bg, col: option.color, border: option.color + "66" };
  };

  // Helper function to get attendance by date (local fallback)
  async function getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/admin/attendance/date/${date}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token") || "",
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error("فشل في جلب البيانات");
      let records = data?.data?.attendance ?? data?.data ?? data?.attendance ?? data;
      if (!Array.isArray(records)) records = [];
      return records;
    } catch {
      return attendance.filter(r => r.date === date);
    }
  }

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
            href="/teacher"
            className="p-2 rounded-xl hover:bg-black/5 transition-colors group flex items-center justify-center"
            title="العودة للرئيسية"
          >
            <Home className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" style={{ color: C.textP }} />
          </Link>
          <Link href="/teacher" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#0A2947] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <CheckCircle2 className="text-[#A8C8E8] w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight leading-none" style={{ color: C.textP }}>
              بوابة المعلم
            </h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: C.textM }}>
              تسجيل الحضور
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
            <BookOpen className="w-4 h-4" />
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        <div
          className={`relative rounded-3xl p-6 sm:p-10 text-white mb-8 overflow-hidden shadow-2xl animate-[fadeUp_0.4s_ease-out_both] ${tr}`}
          style={{ backgroundColor: C.hero }}
        >
          <div className="relative z-10">
            <p className="text-[#A8C8E8] text-xs sm:text-sm font-semibold mb-2 tracking-widest uppercase">
              منصة SMS التعليمية — قسم الحضور
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 text-[#FFFAF3]">
              تسجيل حضور الطلاب 📋
            </h2>
            <p className="text-[#A8C8E8]/90 text-sm mb-4">
              اختر التاريخ وسجل حضور الطلاب بسهولة. يمكنك تحديد حالة كل طالب: حاضر، غائب، متأخر، أو معذور.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#A8C8E8]" />
                <span className="text-white font-bold text-sm">{students.length} طالب</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#A8C8E8]" />
                <span className="text-white font-bold text-sm">{Object.values(attendanceStatus).filter(s => s === "present").length} حاضر</span>
              </div>
            </div>
          </div>
          <div className="absolute -left-16 -top-16 w-72 h-72 bg-[#A8C8E8] rounded-full opacity-10 pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#FFF2DB] rounded-full opacity-5 pointer-events-none" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-[fadeUp_0.45s_ease-out_both]">
          <div className="relative flex-1">
            <Calendar className="absolute top-1/2 -translate-y-1/2 right-4 w-4 h-4 pointer-events-none" style={{ color: C.textM }} />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
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

          <div className="relative flex-1">
            <Search className="absolute top-1/2 -translate-y-1/2 right-4 w-4 h-4 pointer-events-none" style={{ color: C.textM }} />
            <input
              type="text"
              placeholder="ابحث بالاسم..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-11 pl-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all"
              style={{ backgroundColor: C.input, border: `2px solid ${C.border}`, color: C.textP }}
              onFocus={e => (e.target.style.borderColor = C.borderA)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleMarkAllPresent}
              disabled={loading || filtered.length === 0}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#16a34a", color: "#fff" }}
              title="تحديد الجميع كحاضرين"
            >
              <CheckCircle2 className={`w-4 h-4 ${loading ? "opacity-50" : ""}`} />
              <span className="hidden sm:inline">الكل حاضر</span>
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

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 animate-[fadeUp_0.4s_ease-out_both]">
            <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: "#A8C8E8" }} />
            <p className="text-lg font-semibold" style={{ color: C.textM }}>جاري تحميل البيانات...</p>
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

        {saveSuccess && (
          <div className="rounded-2xl p-4 mb-4 flex items-center gap-3 animate-[fadeUp_0.3s_ease-out_both]" style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "2px solid rgba(34,197,94,0.25)" }}>
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <p className="text-green-600 text-sm font-semibold">تم حفظ سجل الحضور بنجاح!</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 animate-[fadeUp_0.4s_ease-out_both]">
            <CheckCircle2 className="w-16 h-16 mb-4 opacity-20" style={{ color: C.textM }} />
            <p className="text-lg font-bold mb-1" style={{ color: C.textS }}>لا يوجد طلاب</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <div className="hidden md:block rounded-3xl overflow-hidden shadow-xl animate-[fadeUp_0.5s_ease-out_both]" style={{ border: `2px solid ${C.border}` }}>
              <div className="grid grid-cols-[3rem_2fr_1fr_1fr_8rem] gap-4 px-6 py-4 text-xs font-extrabold tracking-widest uppercase" style={{ backgroundColor: "#0A2947", color: "#A8C8E8" }}>
                <span>#</span>
                <span>الطالب</span>
                <span>المستوى</span>
                <span>حالة الحضور</span>
                <span className="text-center">إجراء</span>
              </div>

              {filtered.map((student, idx) => {
                const id = String(student._id ?? student.id ?? idx);
                const status = attendanceStatus[id] || "absent";
                const badge = getStatusBadge(status);

                return (
                  <div key={id} className={`grid grid-cols-[3rem_2fr_1fr_1fr_8rem] gap-4 px-6 py-4 items-center ${tr} border-b last:border-b-0`} style={{ backgroundColor: C.card, borderColor: C.border }}>
                    <span className="text-sm font-bold" style={{ color: C.textM }}>{idx + 1}</span>

                    <Link href={`/teacher/students/${id}`} className="flex items-center gap-3 group">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-md transition-transform group-hover:scale-110" style={{ backgroundColor: avatarColor(idx) }}>
                        {initial(student)}
                      </div>
                      <span className="font-bold text-sm transition-colors hover:text-[#3d8ec2]" style={{ color: C.textP }}>
                        {displayName(student)}
                      </span>
                    </Link>

                    <span className="text-sm font-semibold" style={{ color: C.textS }}>
                      {levelLabel(student.level)}
                    </span>

                    <div className="relative">
                      <ChevronDown className="absolute top-1/2 -translate-y-1/2 left-2 w-3 h-3 pointer-events-none" style={{ color: C.textM }} />
                      <select
                        value={status}
                        onChange={e => handleStatusChange(id, e.target.value)}
                        className="appearance-none w-full pr-3 pl-7 py-2 rounded-xl text-xs font-bold outline-none transition-all cursor-pointer"
                        style={{ backgroundColor: C.input, border: `2px solid ${badge.border}`, color: badge.col }}
                      >
                        {ATTENDANCE_STATUS.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ backgroundColor: badge.bg, color: badge.col, border: `1.5px solid ${badge.border}` }}>
                        {badge.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="md:hidden flex flex-col gap-4 animate-[fadeUp_0.5s_ease-out_both]">
              {filtered.map((student, idx) => {
                const id = String(student._id ?? student.id ?? idx);
                const status = attendanceStatus[id] || "absent";
                const badge = getStatusBadge(status);

                return (
                  <div key={id} className={`rounded-2xl p-5 ${tr}`} style={{ backgroundColor: C.card, border: `2px solid ${C.border}`, boxShadow: C.cardSh }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold text-lg shrink-0 shadow-md" style={{ backgroundColor: avatarColor(idx) }}>
                        {initial(student)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/teacher/students/${id}`} className="hover:opacity-80 transition-opacity">
                          <p className="font-extrabold text-sm truncate" style={{ color: C.textP }}>{displayName(student)}</p>
                        </Link>
                        <p className="text-xs truncate mt-0.5" style={{ color: C.textM }}>{levelLabel(student.level)}</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs font-semibold mb-1.5" style={{ color: C.textM }}>حالة الحضور</p>
                      <div className="relative">
                        <ChevronDown className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 pointer-events-none" style={{ color: C.textM }} />
                        <select
                          value={status}
                          onChange={e => handleStatusChange(id, e.target.value)}
                          className="appearance-none w-full pr-4 pl-9 py-2.5 rounded-xl text-sm font-bold outline-none"
                          style={{ backgroundColor: C.input, border: `2px solid ${badge.border}`, color: badge.col }}
                        >
                          {ATTENDANCE_STATUS.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold" style={{ backgroundColor: badge.bg, color: badge.col, border: `1.5px solid ${badge.border}` }}>
                        {badge.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={handleSaveAttendance}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#0A2947", color: "#A8C8E8" }}
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                {saving ? "جاري الحفظ..." : "حفظ سجل الحضور"}
              </button>
            </div>

            <p className="text-center text-xs mt-6" style={{ color: C.textM }}>
              عرض <strong>{filtered.length}</strong> من أصل <strong>{students.length}</strong> طالب
            </p>
          </>
        )}
      </main>
    </div>
  );
}
