"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   src/app/student/exams/page.tsx
   صفحة الاختبارات — للطالب (عرض فقط)

   الميزات:
   - الطالب يدخل معرّف الاختبار الذي أعطاه له المعلم لعرض تفاصيله
   - يرى عنوان الاختبار / المستوى / وقت البدء / المدة / عدد الأسئلة
   - لا يرى الإجابات الصحيحة
   - لا يملك صلاحية الإنشاء أو الحذف
───────────────────────────────────────────────────────────────────────────── */

import {
  ClipboardList, Search, Clock, Calendar,
  Loader2, AlertCircle, X, GraduationCap,
  LogOut, HelpCircle, BookOpen, Menu, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getProfile, UserProfile } from "@/lib/api/user";
import { getExam, Exam, solveExamAPI } from "@/lib/api/exams";
import { LEVEL_OPTIONS } from "@/lib/api/students";
import { useTheme } from "@/components/ThemeProvider";
import { getColors } from "@/lib/theme/colors";
import ThemeToggle from "@/components/ThemeToggle";

export default function StudentExamsPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);
  const tr = "transition-all duration-300 ease-in-out";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [examIdInput, setExamIdInput] = useState("");
  const [exam, setExam] = useState<Exam | null>(null);
  
  /* ── حالة أداء الاختبار ── */
  const [isTakingExam, setIsTakingExam] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [myScore, setMyScore] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    getProfile().then(p => setProfile(p)).catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  const levelLabel = (val?: string) =>
    LEVEL_OPTIONS.find(l => l.value === val)?.label ?? (val || "—");

  const formatDate = (d?: string) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }); }
    catch { return d; }
  };

  const handleSearch = async () => {
    const id = examIdInput.trim();
    if (!id) return setError("يرجى إدخال معرّف الاختبار.");
    setLoading(true);
    setError(null);
    setExam(null);
    setIsTakingExam(false);
    setHasSubmitted(false);
    setMyScore(null);
    setAnswers({});
    try {
      const result = await getExam(id);
      if (!result) return setError("لم يُوجد اختبار بهذا المعرّف.");
      
      // التحقق مما إذا كان الطالب قد أجرى الاختبار مسبقاً
      if (profile && (result as any).results) {
        const existingResult = (result as any).results.find((r: any) => r.studentId === profile._id || r.studentId === profile.id);
        if (existingResult) {
          setHasSubmitted(true);
          setMyScore(existingResult.score);
        }
      }
      setExam(result);
    } catch (err) {
      setError((err as Error).message || "فشل في البحث عن الاختبار.");
    } finally {
      setLoading(false);
    }
  };

  /* ── بدء الاختبار ── */
  const startExam = () => {
    if (hasSubmitted) return;
    setIsTakingExam(true);
  };

  /* ── اختيار إجابة ── */
  const selectAnswer = (qIdx: number, choice: string) => {
    setAnswers(prev => ({ ...prev, [qIdx]: choice }));
  };

  /* ── تسليم الاختبار ── */
  const submitExam = async () => {
    if (!exam || !profile) return;
    if (Object.keys(answers).length < exam.questions.length) {
      if (!window.confirm("لم تقم بالإجابة على جميع الأسئلة. هل أنت متأكد من التسليم الآن؟")) return;
    }
    
    setLoading(true);
    try {
      // إرسال الإجابات عبر الـ API
      // نرسل الإجابات كمصفوفة مرتبة بناءً على عدد أسئلة الاختبار
      const payload = {
        answers: exam.questions.map((_, i) => answers[i] || "")
      };
      const response = await solveExamAPI(exam._id as string, payload);
      
      // نفترض أن الخادم يعيد الدرجة، أو نحسبها محلياً في حالة لم يعيدها
      let score = response?.score ?? response?.data?.score;
      if (score === undefined) {
        score = 0;
        exam.questions.forEach((q, idx) => {
          if (answers[idx] === q.answer) score++;
        });
      }
      
      setMyScore(score);
      setHasSubmitted(true);
      setIsTakingExam(false);
    } catch (err) {
      alert((err as Error).message || "حدث خطأ أثناء تسليم الاختبار.");
    } finally {
      setLoading(false);
    }
  };

  const displayName = (p: UserProfile) =>
    p.fullName ?? p.name ?? p.userName ?? "الطالب";

  return (
    <div className={`min-h-[100dvh] ${tr}`} style={{ backgroundColor: C.page, color: C.textP }} dir="rtl">

      {/* ════ شريط التنقل ════ */}
      <nav
        className={`px-4 sm:px-8 py-3 flex justify-between items-center sticky top-0 z-50 ${tr}`}
        style={{ backgroundColor: C.nav, borderBottom: `1px solid ${C.border}`, boxShadow: C.navShadow }}
      >
        <div className="flex items-center gap-3">
          <Link href="/student/profile" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#0A2947] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <GraduationCap className="text-[#A8C8E8] w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold leading-none" style={{ color: C.textP }}>
              {profile ? displayName(profile) : "بوابة الطالب"}
            </h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: C.textM }}>الاختبارات</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block"><ThemeToggle /></div>
          <Link href="/student/profile" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-all hover:-translate-y-0.5" style={{ color: C.textS, backgroundColor: C.icon }}>
            <BookOpen className="w-4 h-4" /> ملفي الشخصي
          </Link>
          <button onClick={handleLogout} className="hidden sm:flex items-center gap-1.5 text-red-500 hover:text-red-700 font-semibold text-sm px-3 py-2 rounded-xl hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4" /> خروج
          </button>
          <button className="sm:hidden p-2 rounded-xl hover:bg-black/5" style={{ color: C.textP }} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="sm:hidden absolute left-0 right-0 top-[65px] z-40 p-4 border-b shadow-lg" style={{ backgroundColor: C.nav, borderColor: C.border }}>
          <div className="flex flex-col gap-3">
            <Link href="/student/profile" className="flex items-center gap-3 p-2 rounded-xl hover:bg-black/5" style={{ color: C.textP }} onClick={() => setIsMobileMenuOpen(false)}>
              <BookOpen className="w-5 h-5" /><span className="font-semibold text-sm">ملفي الشخصي</span>
            </Link>
            <div className="flex items-center gap-3 p-2 rounded-xl" style={{ color: C.textP }}>
              <span className="font-semibold text-sm flex-1">المظهر</span><ThemeToggle />
            </div>
            <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="flex items-center gap-3 p-2 rounded-xl text-red-500 font-semibold text-sm w-full hover:bg-red-50">
              <LogOut className="w-5 h-5" /><span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* ── لافتة ترحيب ── */}
        <div className={`relative rounded-3xl p-6 sm:p-10 text-white mb-8 overflow-hidden shadow-2xl animate-[fadeUp_0.4s_ease-out_both] ${tr}`} style={{ backgroundColor: C.hero }}>
          <div className="relative z-10">
            <p className="text-[#A8C8E8] text-xs sm:text-sm font-semibold mb-2 tracking-widest uppercase">منصة SMS التعليمية</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 text-[#FFFAF3]">الاختبارات 📋</h2>
            <p className="text-[#A8C8E8]/90 text-sm">
              أدخل معرّف الاختبار الذي أعطاك إياه المعلم لعرض تفاصيله.
            </p>
          </div>
          <div className="absolute -left-16 -top-16 w-72 h-72 bg-[#A8C8E8] rounded-full opacity-10 pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#FFF2DB] rounded-full opacity-5 pointer-events-none" />
        </div>

        {/* ── صندوق البحث ── */}
        <div className="rounded-3xl p-5 sm:p-7 mb-6 animate-[fadeUp_0.45s_ease-out_both]" style={{ backgroundColor: C.card, border: `2px solid ${C.border}`, boxShadow: C.cardSh }}>
          <label className="block text-sm font-bold mb-2" style={{ color: C.textP }}>
            معرّف الاختبار (Exam ID)
          </label>
          <p className="text-xs mb-3" style={{ color: C.textM }}>
            اطلب معرّف الاختبار من معلمك ثم الصقه هنا.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="مثال: 6a431c7abb9da6766e40fcba"
              value={examIdInput}
              onChange={e => setExamIdInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="flex-1 px-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all"
              style={{ backgroundColor: C.input, border: `2px solid ${C.border}`, color: C.textP }}
              onFocus={e => (e.target.style.borderColor = C.borderA)}
              onBlur={e => (e.target.style.borderColor = C.border)}
              dir="ltr"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !examIdInput.trim()}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#0A2947", color: "#A8C8E8" }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              بحث
            </button>
          </div>

          {error && (
            <div className="mt-3 rounded-2xl p-3 flex items-center gap-2" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.25)" }}>
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-red-600 text-xs font-semibold">{error}</p>
            </div>
          )}
        </div>

        {/* ── بطاقة تفاصيل الاختبار ── */}
        {exam && (
          <div className="rounded-3xl p-5 sm:p-7 animate-[fadeUp_0.5s_ease-out_both]" style={{ backgroundColor: C.card, border: `2px solid ${C.border}`, boxShadow: C.cardSh }}>
            {/* رأس بطاقة الاختبار */}
            <div className="flex items-start gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[#0A2947] flex items-center justify-center shrink-0">
                <ClipboardList className="text-[#A8C8E8] w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg leading-snug" style={{ color: C.textP }}>{exam.title}</h3>
                <span className="inline-block mt-1 text-xs px-2.5 py-1 rounded-xl font-bold" style={{ backgroundColor: "rgba(168,200,232,0.2)", color: "#0A2947" }}>
                  {levelLabel(exam.level)}
                </span>
              </div>
            </div>

            {/* معلومات سريعة */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: C.icon }}>
                <Calendar className="w-4 h-4 mx-auto mb-1" style={{ color: C.textM }} />
                <p className="text-xs font-bold" style={{ color: C.textP }}>{formatDate(exam.startAt)}</p>
                <p className="text-xs mt-0.5" style={{ color: C.textM }}>وقت البدء</p>
              </div>
              <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: C.icon }}>
                <Clock className="w-4 h-4 mx-auto mb-1" style={{ color: C.textM }} />
                <p className="text-xs font-bold" style={{ color: C.textP }}>{exam.duration} دقيقة</p>
                <p className="text-xs mt-0.5" style={{ color: C.textM }}>المدة</p>
              </div>
              <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: C.icon }}>
                <HelpCircle className="w-4 h-4 mx-auto mb-1" style={{ color: C.textM }} />
                <p className="text-xs font-bold" style={{ color: C.textP }}>{exam.questions.length} سؤال</p>
                <p className="text-xs mt-0.5" style={{ color: C.textM }}>الأسئلة</p>
              </div>
            </div>

            {hasSubmitted ? (
              <div className="rounded-3xl p-8 text-center animate-[fadeUp_0.3s_ease-out_both] border-2 shadow-sm" style={{ backgroundColor: myScore && myScore >= exam.questions.length / 2 ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)", borderColor: myScore && myScore >= exam.questions.length / 2 ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)" }}>
                <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 shadow-md" style={{ backgroundColor: myScore && myScore >= exam.questions.length / 2 ? "#16a34a" : "#dc2626" }}>
                  <GraduationCap className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-extrabold mb-2" style={{ color: C.textP }}>
                  {myScore && myScore >= exam.questions.length / 2 ? "ممتاز! لقد اجتزت الاختبار" : "حظاً أوفر المرة القادمة"}
                </h3>
                <p className="text-sm font-semibold mb-5" style={{ color: C.textM }}>
                  لقد أتممت هذا الاختبار وسُجلت نتيجتك.
                </p>
                <div className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-2xl font-black shadow-sm" style={{ backgroundColor: C.card, border: `2px solid ${C.border}`, color: C.textP }}>
                  {myScore} <span className="text-lg opacity-50">/</span> {exam.questions.length}
                </div>
              </div>
            ) : isTakingExam ? (
              <div className="animate-[fadeUp_0.4s_ease-out_both]">
                <div className="flex items-center justify-between mb-4 pb-4 border-b" style={{ borderColor: C.border }}>
                  <h4 className="font-extrabold text-sm" style={{ color: C.textP }}>الأسئلة</h4>
                  <span className="text-xs font-bold px-3 py-1 rounded-xl" style={{ backgroundColor: "rgba(168,200,232,0.2)", color: "#0A2947" }}>
                    مُجاب: {Object.keys(answers).length} / {exam.questions.length}
                  </span>
                </div>
                
                <div className="flex flex-col gap-6 mb-8">
                  {exam.questions.map((q, i) => (
                    <div key={i} className="rounded-3xl p-5" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(10,41,71,0.02)", border: `2px solid ${answers[i] ? "rgba(34,197,94,0.3)" : C.border}` }}>
                      <p className="font-bold text-sm mb-4 leading-relaxed" style={{ color: C.textP }}>
                        <span className="inline-flex items-center justify-center w-7 h-7 text-xs rounded-xl ml-3 font-extrabold" style={{ backgroundColor: "#0A2947", color: "#A8C8E8" }}>{i + 1}</span>
                        {q.question}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-10">
                        {q.choices.map((c, ci) => {
                          const isSelected = answers[i] === c;
                          return (
                            <button
                              key={ci}
                              onClick={() => selectAnswer(i, c)}
                              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all text-right border-2 ${isSelected ? 'shadow-md scale-[1.02]' : 'hover:scale-[1.01]'}`}
                              style={{ 
                                backgroundColor: isSelected ? "rgba(10,41,71,0.9)" : C.input, 
                                borderColor: isSelected ? "#0A2947" : C.border, 
                                color: isSelected ? "#FFFAF3" : C.textP 
                              }}
                            >
                              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] shrink-0 transition-colors ${isSelected ? 'border-white text-white' : ''}`} style={{ borderColor: isSelected ? 'rgba(255,255,255,0.3)' : C.border, color: isSelected ? '#fff' : C.textM }}>
                                {String.fromCharCode(65 + ci)}
                              </span>
                              {c}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={submitExam}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-base transition-all hover:-translate-y-1 shadow-xl hover:shadow-2xl disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#0A2947", color: "#A8C8E8" }}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ClipboardList className="w-5 h-5" />}
                  تسليم الاختبار
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <button
                  onClick={startExam}
                  className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl font-black text-lg transition-all hover:-translate-y-1 shadow-xl hover:shadow-2xl"
                  style={{ backgroundColor: "#16a34a", color: "#fff" }}
                >
                  بدء الاختبار
                </button>
                <p className="text-xs font-semibold mt-4" style={{ color: C.textM }}>
                  تأكد من استقرار اتصالك بالإنترنت قبل البدء
                </p>
              </div>
            )}
          </div>
        )}

        {!exam && !loading && !error && (
          <div className="flex flex-col items-center py-16 animate-[fadeUp_0.5s_ease-out_both]">
            <ClipboardList className="w-16 h-16 mb-4 opacity-20" style={{ color: C.textM }} />
            <p className="text-base font-bold" style={{ color: C.textS }}>لا يوجد اختبار معروض</p>
            <p className="text-sm mt-1" style={{ color: C.textM }}>أدخل معرّف الاختبار أعلاه للبحث عنه</p>
          </div>
        )}
      </main>
    </div>
  );
}
