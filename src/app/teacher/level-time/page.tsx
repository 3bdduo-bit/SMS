"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   src/app/teacher/level-time/page.tsx
   صفحة إدارة أوقات المستويات الدراسية للمعلم

   الميزات:
   - عرض جميع أوقات المستويات الدراسية
   - إضافة وقت جديد لمستوى دراسي
   - تعديل وقت مستوى دراسي موجود
   - حذف وقت مستوى دراسي
   - دعم الوضع الليلي + RTL + اللغة العربية
───────────────────────────────────────────────────────────────────────────── */

import {
  Clock, Plus, Edit2, Trash2, Save, X,
  GraduationCap, Calendar, ChevronLeft
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { getColors } from "@/lib/theme/colors";
import ThemeToggle from "@/components/ThemeToggle";
import {
  getAllLevelTimes,
  addLevelTime,
  updateLevelTime,
  deleteLevelTime,
  LevelTime,
  LEVEL_OPTIONS,
  DAY_OPTIONS,
  getLevelLabel,
  getDayLabel
} from "@/lib/api/levelTime";

/* ════════════════════════════════════════════════════════════════════════════
   أنواع البيانات المحلية
════════════════════════════════════════════════════════════════════════════ */

interface LevelTimeFormData {
  level: string;
  day: string;
  startTime: string;
  endTime: string;
}

/* ════════════════════════════════════════════════════════════════════════════
   المكوّن الرئيسي
════════════════════════════════════════════════════════════════════════════ */
export default function LevelTimePage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);

  const [levelTimes, setLevelTimes] = useState<LevelTime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /* ── نموذج الإضافة/التعديل ── */
  const [formData, setFormData] = useState<LevelTimeFormData>({
    level: "",
    day: "",
    startTime: "",
    endTime: "",
  });

  /* ── المستوى المحدد للعرض التفصيلي ── */
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  /* ── transition مشترك ── */
  const tr = "transition-all duration-300 ease-in-out";

  /* ── جلب البيانات عند التحميل ── */
  useEffect(() => {
    loadLevelTimes();
  }, []);

  /* ── جلب أوقات المستويات ── */
  const loadLevelTimes = async () => {
    try {
      setIsLoading(true);
      const data = await getAllLevelTimes();
      setLevelTimes(data);
    } catch (error) {
      console.error("Failed to fetch level times:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── تسجيل الخروج ── */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  /* ── إعادة تعيين النموذج ── */
  const resetForm = () => {
    setFormData({
      level: selectedLevel || "",
      day: "",
      startTime: "",
      endTime: "",
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  /* ── بدء التعديل ── */
  const handleEdit = (levelTime: LevelTime) => {
    setFormData({
      level: selectedLevel || levelTime.level,
      day: levelTime.day || "",
      startTime: levelTime.startTime || "",
      endTime: levelTime.endTime || "",
    });
    setEditingId(levelTime._id || levelTime.id?.toString() || "");
    setShowAddForm(true);
  };

  /* ── اختيار مستوى للعرض التفصيلي ── */
  const handleSelectLevel = (level: string) => {
    setSelectedLevel(level);
    setShowAddForm(false);
    setEditingId(null);
    setFormData({
      level,
      day: "",
      startTime: "",
      endTime: "",
    });
  };

  /* ── إضافة وقت للمستوى المحدد ── */
  const handleAddTimeForLevel = () => {
    setFormData({
      level: selectedLevel || "",
      day: "",
      startTime: "",
      endTime: "",
    });
    setEditingId(null);
    setShowAddForm(true);
  };

  /* ── إغلاق عرض المستوى المحدد ── */
  const handleCloseLevelView = () => {
    setSelectedLevel(null);
    setShowAddForm(false);
    setEditingId(null);
    setFormData({
      level: "",
      day: "",
      startTime: "",
      endTime: "",
    });
  };

  /* ── حفظ الإضافة/التعديل ── */
  const handleSave = async () => {
    try {
      const _payload = {
        level: formData.level,
        day: formData.day,
        startTime: formData.startTime,
        endTime: formData.endTime,
      };

      if (editingId) {
        await updateLevelTime(editingId, _payload);
      } else {
        await addLevelTime(_payload);
      }
      await loadLevelTimes();
      resetForm();
    } catch (error) {
      console.error("Failed to save level time:", error);
      const errorMessage = error instanceof Error ? error.message : "فشل في حفظ وقت المستوى";
      alert(errorMessage);
    }
  };

  /* ── حذف وقت المستوى ── */
  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الوقت؟")) return;
    
    try {
      await deleteLevelTime(id);
      await loadLevelTimes();
    } catch (error) {
      console.error("Failed to delete level time:", error);
      alert("فشل في حذف وقت المستوى");
    }
  };

  /* ── تجميع الأوقات حسب المستوى ── */
  const groupedByLevel = levelTimes.reduce((acc, time) => {
    const level: string = time.level;
    if (!acc[level]) acc[level] = [];
    acc[level].push(time);
    return acc;
  }, {} as Record<string, LevelTime[]>);

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
            إدارة أوقات المستويات
          </h1>
        </div>

        {/* أيقونات اليمين */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1.5 text-red-500 hover:text-red-700 font-semibold text-sm transition-colors px-3 py-2 rounded-xl hover:bg-red-50"
          >
            خروج
          </button>

          <button
            className="sm:hidden p-2 rounded-xl hover:bg-black/5 transition-colors"
            style={{ color: C.textP }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* ════════════ القائمة المنسدلة للموبايل ════════════ */}
      {isMobileMenuOpen && (
        <div
          className="sm:hidden absolute left-0 right-0 top-[65px] z-40 p-4 border-b shadow-lg"
          style={{ backgroundColor: C.nav, borderColor: C.border }}
        >
          <Link
            href="/teacher"
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-black/5 mb-3"
            style={{ color: C.textP }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-semibold text-sm">العودة للرئيسية</span>
          </Link>
          <button
            onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-red-50 text-red-500 font-semibold text-sm w-full"
          >
            تسجيل الخروج
          </button>
        </div>
      )}

      {/* ════════════ المحتوى الرئيسي ════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* ── لافتة العنوان ── */}
        <div
          className={`relative rounded-3xl p-7 sm:p-12 text-white mb-10 overflow-hidden shadow-2xl ${tr}`}
          style={{ backgroundColor: C.hero }}
        >
          <div className="relative z-10 max-w-2xl">
            <p className="text-[#A8C8E8] text-xs sm:text-sm font-semibold mb-2 tracking-widest uppercase">
              إدارة الجدول الدراسي
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 text-[#FFFAF3] leading-snug">
              أوقات المستويات الدراسية ⏰
            </h2>
            <p className="text-[#A8C8E8]/90 text-sm sm:text-base mb-7 leading-relaxed">
              أدِر أوقات الحصص لكل مستوى دراسي، أضف أوقات جديدة، عدّل الأوقات الحالية، أو احذفها.
            </p>
            <button
              onClick={() => {
                setFormData({
                  level: "",
                  day: "",
                  startTime: "",
                  endTime: "",
                });
                setEditingId(null);
                setShowAddForm(true);
              }}
              className="bg-[#FFF2DB] text-[#0A2947] px-7 py-3 rounded-xl font-extrabold hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-sm sm:text-base cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة وقت جديد
            </button>
          </div>

          {/* دوائر زخرفية */}
          <div className="absolute -left-16 -top-16 w-72 h-72 bg-[#A8C8E8] rounded-full opacity-10 pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#FFF2DB] rounded-full opacity-5 pointer-events-none" />
        </div>

        {/* ── نموذج الإضافة/التعديل (يظهر فقط عند عدم تحديد مستوى) ── */}
        {showAddForm && !selectedLevel && (
          <div
            className={`rounded-2xl p-6 mb-8 shadow-lg ${tr}`}
            style={{ backgroundColor: C.card, border: `2px solid ${C.border}` }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold" style={{ color: C.textP }}>
                {editingId ? "تعديل وقت المستوى" : "إضافة وقت جديد"}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 rounded-xl hover:bg-red-50 transition-colors"
                style={{ color: C.textM }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* اختيار المستوى */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: C.textP }}>
                  المستوى الدراسي
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 focus:outline-none focus:border-[#0A2947] transition-colors"
                  style={{ backgroundColor: C.page, borderColor: C.border, color: C.textP }}
                >
                  <option value="">اختر المستوى</option>
                  {LEVEL_OPTIONS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* اختيار اليوم */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: C.textP }}>
                  اليوم
                </label>
                <select
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 focus:outline-none focus:border-[#0A2947] transition-colors"
                  style={{ backgroundColor: C.page, borderColor: C.border, color: C.textP }}
                >
                  <option value="">اختر اليوم</option>
                  {DAY_OPTIONS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* وقت البداية */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: C.textP }}>
                  وقت البداية
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 focus:outline-none focus:border-[#0A2947] transition-colors"
                  style={{ backgroundColor: C.page, borderColor: C.border, color: C.textP }}
                />
              </div>

              {/* وقت النهاية */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: C.textP }}>
                  وقت النهاية
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 focus:outline-none focus:border-[#0A2947] transition-colors"
                  style={{ backgroundColor: C.page, borderColor: C.border, color: C.textP }}
                />
              </div>
            </div>

            {/* أزرار الحفظ والإلغاء */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={!formData.level || !formData.day || !formData.startTime || !formData.endTime}
                className="flex-1 bg-[#0A2947] text-[#A8C8E8] px-6 py-3 rounded-xl font-extrabold hover:bg-[#0A2947]/80 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingId ? "حفظ التعديلات" : "إضافة الوقت"}
              </button>
              <button
                onClick={resetForm}
                className="px-6 py-3 rounded-xl font-extrabold transition-all duration-300 border-2"
                style={{ 
                  backgroundColor: C.card, 
                  borderColor: C.border, 
                  color: C.textP 
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* ── حالة التحميل ── */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#0A2947] border-t-transparent"></div>
            <p className="mt-4" style={{ color: C.textM }}>جاري التحميل...</p>
          </div>
        ) : (
          /* ── عرض الأوقات المجمعة حسب المستوى ── */
          <div className="space-y-6">
            {!selectedLevel ? (
              /* ── عرض جميع المستويات كبطاقات ── */
              <>
                {Object.entries(groupedByLevel).length === 0 ? (
                  <div
                    className="rounded-2xl p-12 text-center"
                    style={{ backgroundColor: C.card, border: `2px solid ${C.border}` }}
                  >
                    <Clock className="w-16 h-16 mx-auto mb-4" style={{ color: C.textM }} />
                    <p className="text-lg font-semibold mb-2" style={{ color: C.textP }}>
                      لا توجد أوقات مستويات
                    </p>
                    <p style={{ color: C.textS }}>
                      ابدأ بإضافة وقت جديد للمستويات الدراسية
                    </p>
                    <button
                      onClick={() => {
                        setFormData({
                          level: "",
                          day: "",
                          startTime: "",
                          endTime: "",
                        });
                        setEditingId(null);
                        setShowAddForm(true);
                      }}
                      className="mt-4 bg-[#0A2947] text-[#A8C8E8] px-6 py-3 rounded-xl font-extrabold hover:bg-[#0A2947]/80 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة وقت جديد
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(groupedByLevel).map(([level, times]) => (
                        <div
                          key={level}
                          className={`rounded-2xl p-6 cursor-pointer hover:scale-105 transition-transform duration-300 ${tr}`}
                          style={{ backgroundColor: C.card, border: `2px solid ${C.border}` }}
                          onClick={() => handleSelectLevel(level)}
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: "#0A2947" }}
                            >
                              <Calendar className="w-6 h-6 text-[#A8C8E8]" />
                            </div>
                            <div>
                              <h3 className="font-extrabold text-lg" style={{ color: C.textP }}>
                                {getLevelLabel(level)}
                              </h3>
                              <span
                                className="text-xs font-semibold px-2 py-1 rounded-full"
                                style={{ backgroundColor: "rgba(168,200,232,0.2)", color: "#0A2947" }}
                              >
                                {times.length} حصة
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm" style={{ color: C.textS }}>
                            <ChevronLeft className="w-4 h-4" />
                            <span>اضغط لإدارة الجدول</span>
                          </div>
                        </div>
                      ))}
                      
                      {/* بطاقة إضافة مستوى جديد */}
                      <div
                        className={`rounded-2xl p-6 cursor-pointer hover:scale-105 transition-transform duration-300 border-dashed ${tr}`}
                        style={{
                          backgroundColor: "transparent",
                          border: `2px dashed ${C.border}`
                        }}
                        onClick={() => {
                          setSelectedLevel(null);
                          setFormData({
                            level: "",
                            day: "",
                            startTime: "",
                            endTime: "",
                          });
                          setEditingId(null);
                          setShowAddForm(true);
                        }}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: "rgba(168,200,232,0.2)" }}
                          >
                            <Plus className="w-6 h-6 text-[#0A2947]" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-lg" style={{ color: C.textP }}>
                              إضافة مستوى جديد
                            </h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm" style={{ color: C.textS }}>
                          <span>اضغط لإضافة وقت لمستوى جديد</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              /* ── عرض الجدول التفصيلي للمستوى المحدد ── */
              <>
                <button
                  onClick={handleCloseLevelView}
                  className="flex items-center gap-2 mb-6 font-semibold transition-colors hover:text-[#0A2947]"
                  style={{ color: C.textM }}
                >
                  <ChevronLeft className="w-5 h-5" />
                  العودة لجميع المستويات
                </button>

                <div
                  className={`rounded-2xl overflow-hidden shadow-lg ${tr}`}
                  style={{ backgroundColor: C.card, border: `2px solid ${C.border}` }}
                >
                  {/* رأس المستوى */}
                  <div
                    className="px-6 py-4 flex items-center justify-between"
                    style={{ backgroundColor: "#0A2947" }}
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-[#A8C8E8]" />
                      <h3 className="text-lg font-extrabold text-[#FFFAF3]">
                        {getLevelLabel(selectedLevel)}
                      </h3>
                      <span className="bg-[#A8C8E8]/20 text-[#A8C8E8] text-xs font-extrabold px-3 py-1 rounded-full">
                        {groupedByLevel[selectedLevel]?.length || 0} حصة
                      </span>
                    </div>
                    <button
                      onClick={handleAddTimeForLevel}
                      className="bg-[#FFF2DB] text-[#0A2947] px-4 py-2 rounded-xl font-extrabold hover:bg-white transition-all duration-300 flex items-center gap-2 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة حصة
                    </button>
                  </div>

                  {/* قائمة الأيام مع الأوقات */}
                  <div className="p-6">
                    {/* نموذج إضافة حصة للمستوى المحدد */}
                    {showAddForm && selectedLevel && (
                      <div
                        className={`rounded-xl p-5 mb-6 ${tr}`}
                        style={{ backgroundColor: C.page, border: `2px solid ${C.border}` }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-extrabold" style={{ color: C.textP }}>
                            {editingId ? "تعديل الحصة" : "إضافة حصة جديدة"}
                          </h4>
                          <button
                            onClick={resetForm}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                            style={{ color: C.textM }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {/* اختيار اليوم */}
                          <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: C.textP }}>
                              اليوم
                            </label>
                            <select
                              value={formData.day}
                              onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                              className="w-full p-3 rounded-xl border-2 focus:outline-none focus:border-[#0A2947] transition-colors"
                              style={{ backgroundColor: C.card, borderColor: C.border, color: C.textP }}
                            >
                              <option value="">اختر اليوم</option>
                              {DAY_OPTIONS.map((day) => (
                                <option key={day.value} value={day.value}>
                                  {day.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* وقت البداية */}
                          <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: C.textP }}>
                              وقت البداية
                            </label>
                            <input
                              type="time"
                              value={formData.startTime}
                              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                              className="w-full p-3 rounded-xl border-2 focus:outline-none focus:border-[#0A2947] transition-colors"
                              style={{ backgroundColor: C.card, borderColor: C.border, color: C.textP }}
                            />
                          </div>

                          {/* وقت النهاية */}
                          <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: C.textP }}>
                              وقت النهاية
                            </label>
                            <input
                              type="time"
                              value={formData.endTime}
                              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                              className="w-full p-3 rounded-xl border-2 focus:outline-none focus:border-[#0A2947] transition-colors"
                              style={{ backgroundColor: C.card, borderColor: C.border, color: C.textP }}
                            />
                          </div>
                        </div>

                        {/* أزرار الحفظ والإلغاء */}
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={handleSave}
                            disabled={!formData.level || !formData.day || !formData.startTime || !formData.endTime}
                            className="flex-1 bg-[#0A2947] text-[#A8C8E8] px-4 py-2 rounded-xl font-extrabold hover:bg-[#0A2947]/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                          >
                            <Save className="w-4 h-4" />
                            {editingId ? "حفظ التعديلات" : "إضافة الحصة"}
                          </button>
                          <button
                            onClick={resetForm}
                            className="px-4 py-2 rounded-xl font-extrabold transition-all duration-300 border-2 text-sm"
                            style={{
                              backgroundColor: C.card,
                              borderColor: C.border,
                              color: C.textP
                            }}
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    )}

                    {DAY_OPTIONS.map((dayOption) => {
                      const dayTimes = (groupedByLevel[selectedLevel] || []).filter(
                        (t) => t.day === dayOption.value
                      );

                      if (dayTimes.length === 0) return null;

                      return (
                        <div
                          key={dayOption.value}
                          className="mb-6 last:mb-0"
                        >
                          {/* عنوان اليوم */}
                          <div
                            className="flex items-center gap-3 mb-3 pb-2 border-b-2"
                            style={{ borderColor: C.border }}
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: "rgba(168,200,232,0.2)" }}
                            >
                              <Clock className="w-5 h-5" style={{ color: C.textP }} />
                            </div>
                            <h4 className="font-extrabold text-lg" style={{ color: C.textP }}>
                              {dayOption.label}
                            </h4>
                            <span
                              className="text-xs font-semibold px-2 py-1 rounded-full"
                              style={{ backgroundColor: "rgba(168,200,232,0.2)", color: "#0A2947" }}
                            >
                              {dayTimes.length} حصة
                            </span>
                          </div>

                          {/* قائمة أوقات هذا اليوم */}
                          <div className="space-y-3 mr-12">
                            {dayTimes.map((time) => (
                              <div
                                key={time._id || time.id}
                                className={`rounded-xl p-4 flex items-center justify-between hover:bg-black/5 transition-colors ${tr}`}
                                style={{ backgroundColor: C.page, border: `1px solid ${C.border}` }}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-3">
                                    <span
                                      className="font-extrabold px-3 py-1 rounded-lg"
                                      style={{ 
                                        backgroundColor: "rgba(168,200,232,0.3)", 
                                        color: "#0A2947" 
                                      }}
                                    >
                                      {time.startTime}
                                    </span>
                                    <span style={{ color: C.textM }}>→</span>
                                    <span
                                      className="font-extrabold px-3 py-1 rounded-lg"
                                      style={{ 
                                        backgroundColor: "rgba(168,200,232,0.3)", 
                                        color: "#0A2947" 
                                      }}
                                    >
                                      {time.endTime}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleEdit(time)}
                                    className="p-2 rounded-lg hover:bg-[#0A2947]/10 transition-colors"
                                    style={{ color: C.textM }}
                                    title="تعديل"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(time._id || time.id?.toString() || "")}
                                    className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-500"
                                    title="حذف"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {DAY_OPTIONS.every(
                      (day) =>
                        !(groupedByLevel[selectedLevel] || []).some((t) => t.day === day.value)
                    ) && (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: C.textM }} />
                        <p className="font-semibold mb-2" style={{ color: C.textP }}>
                          لا توجد حصص مسجلة
                        </p>
                        <p style={{ color: C.textS }}>
                          اضغط على "إضافة حصة" لبدء إضافة أوقات الحصص
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}