"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   src/app/teacher/videos/page.tsx
   صفحة إدارة الفيديوهات التعليمية — خاصة بالمعلم

   الميزات:
   - إضافة فيديوهات جديدة (عنوان، وصف، رابط YouTube، مستوى)
   - عرض الفيديوهات مجمّعة حسب المستوى الدراسي
   - تعديل وحذف الفيديوهات
   - صور مصغرة تلقائية من YouTube
   - فلترة حسب المستوى + بحث نصي
   - بيانات تجريبية تُحمَّل أول مرة
   - دعم الوضع الليلي + RTL + اللغة العربية
───────────────────────────────────────────────────────────────────────────── */

import {
  Video as VideoIcon, Search, GraduationCap, LogOut, ChevronLeft,
  Edit3, Check, X, AlertCircle, Loader2, RefreshCw,
  Menu, ChevronDown, Plus, Trash2, Play, Clock, ExternalLink
, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { getProfile, UserProfile } from "@/lib/api/user";
import { LEVEL_OPTIONS } from "@/lib/api/students";
import {
  getVideos, getVideosByLevel, addVideo, updateVideo, deleteVideo,
  Video, getYouTubeThumbnail, getYouTubeEmbedUrl
} from "@/lib/api/videos";
import { useTheme } from "@/components/ThemeProvider";
import { getColors } from "@/lib/theme/colors";
import ThemeToggle from "@/components/ThemeToggle";

/* ════════════════════════════════════════════════════════════════════════════
   المكوّن الرئيسي
════════════════════════════════════════════════════════════════════════════ */
export default function TeacherVideosPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);

  /* ── الحالات ── */
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* فلترة وبحث */
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  /* نموذج الإضافة/التعديل */
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoUrl: "",
    level: "one",
    duration: "",
  });

  /* حالة عرض الفيديو */
  const [playingVideoId, setPlayingVideoId] = useState<string | number | null>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /* ── transition مشترك ── */
  const tr = "transition-all duration-300 ease-in-out";

  /* ── جلب الملف الشخصي ── */
  useEffect(() => {
    getProfile().then(p => setProfile(p)).catch(() => {});
  }, []);

  /* ── جلب الفيديوهات ── */
  useEffect(() => {
    fetchVideos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelFilter]);

  /* دالة جلب الفيديوهات */
  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: Video[] = [];
      if (levelFilter !== "all") {
        data = await getVideosByLevel(levelFilter);
      } else {
        data = await getVideos();
      }
      setVideos(data);
    } catch (err) {
      setError((err as Error).message || "فشل في تحميل الفيديوهات.");
    } finally {
      setLoading(false);
    }
  };

  /* ── تحديث ── */
  const handleRefresh = async () => {
    await fetchVideos();
  };

  /* ── تسجيل الخروج ── */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  /* ── إضافة فيديو ── */
  const handleAddVideo = async () => {
    if (!formData.title.trim()) {
      setError("يرجى إدخال عنوان الفيديو");
      return;
    }
    if (!formData.videoUrl.trim()) {
      setError("يرجى إدخال رابط الفيديو");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await addVideo(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setShowAddForm(false);
      resetForm();
      await handleRefresh();
    } catch (err) {
      setError((err as Error).message || "فشل في إضافة الفيديو.");
    } finally {
      setSaving(false);
    }
  };

  /* ── تعديل فيديو ── */
  const handleEditVideo = async () => {
    if (!editingVideo || !formData.title.trim()) {
      setError("يرجى إدخال عنوان الفيديو");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateVideo(editingVideo.id || editingVideo._id || "", formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setEditingVideo(null);
      setShowAddForm(false);
      resetForm();
      await handleRefresh();
    } catch (err) {
      setError((err as Error).message || "فشل في تحديث الفيديو.");
    } finally {
      setSaving(false);
    }
  };

  /* ── حذف فيديو ── */
  const handleDeleteVideo = async (video: Video) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الفيديو؟")) return;

    try {
      await deleteVideo(video.id || video._id || "");
      await handleRefresh();
    } catch (err) {
      setError((err as Error).message || "فشل في حذف الفيديو.");
    }
  };

  /* ── بدء التعديل ── */
  const startEdit = (video: Video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title || "",
      description: video.description || "",
      videoUrl: video.videoUrl || "",
      level: video.level || "one",
      duration: video.duration || "",
    });
    setShowAddForm(true);
    /* التمرير لأعلى لرؤية النموذج */
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── إلغاء التعديل ── */
  const cancelEdit = () => {
    setEditingVideo(null);
    setShowAddForm(false);
    resetForm();
  };

  /* ── إعادة تعيين النموذج ── */
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      videoUrl: "",
      level: "one",
      duration: "",
    });
  };

  /* ── فلترة بالبحث النصي ── */
  const filtered = useMemo(() => {
    return videos.filter(v => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (v.title || "").toLowerCase().includes(q) ||
             (v.description || "").toLowerCase().includes(q);
    });
  }, [videos, searchQuery]);

  /* ── تجميع الفيديوهات حسب المستوى ── */
  const groupedByLevel = useMemo(() => {
    const groups: Record<string, Video[]> = {};
    for (const v of filtered) {
      const lvl = v.level || "unknown";
      if (!groups[lvl]) groups[lvl] = [];
      groups[lvl].push(v);
    }
    /* ترتيب حسب ترتيب المستويات الأصلي */
    const ordered: { level: string; label: string; videos: Video[] }[] = [];
    for (const opt of LEVEL_OPTIONS) {
      if (groups[opt.value]) {
        ordered.push({ level: opt.value, label: opt.label, videos: groups[opt.value] });
      }
    }
    /* إضافة أي مستوى غير معروف */
    if (groups["unknown"]) {
      ordered.push({ level: "unknown", label: "بدون مستوى", videos: groups["unknown"] });
    }
    return ordered;
  }, [filtered]);

  /* ── اسم المستوى ── */
  const levelLabel = (val?: string) =>
    LEVEL_OPTIONS.find(l => l.value === val)?.label ?? (val ?? "—");

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
          <Link
            href="/teacher"
            className="p-2 rounded-xl hover:bg-black/5 transition-colors group flex items-center justify-center"
            title="العودة للرئيسية"
          >
            <Home className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" style={{ color: C.textP }} />
          </Link>
          <Link href="/teacher" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#0A2947] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <VideoIcon className="text-[#A8C8E8] w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight leading-none" style={{ color: C.textP }}>
              بوابة المعلم
            </h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: C.textM }}>
              الفيديوهات التعليمية
            </p>
          </div>
        </div>

        {/* أيقونات اليمين */}
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

          {/* قائمة الموبايل */}
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

      {/* ════════════ المحتوى الرئيسي ════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* ── بانر علوي (Hero) ── */}
        <div
          className={`relative rounded-3xl p-6 sm:p-10 text-white mb-8 overflow-hidden shadow-2xl animate-[fadeUp_0.4s_ease-out_both] ${tr}`}
          style={{ backgroundColor: C.hero }}
        >
          <div className="relative z-10">
            <p className="text-[#A8C8E8] text-xs sm:text-sm font-semibold mb-2 tracking-widest uppercase">
              منصة SMS التعليمية — قسم الفيديوهات
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 text-[#FFFAF3]">
              الفيديوهات التعليمية 🎬
            </h2>
            <p className="text-[#A8C8E8]/90 text-sm mb-4">
              أضف فيديوهات تعليمية لكل مستوى دراسي. الطلاب سيشاهدون الفيديوهات الخاصة بمستواهم فقط.
            </p>
            {/* إحصائيات سريعة */}
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2">
                <VideoIcon className="w-4 h-4 text-[#A8C8E8]" />
                <span className="text-white font-bold text-sm">{videos.length} فيديو</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2">
                <Play className="w-4 h-4 text-[#A8C8E8]" />
                <span className="text-white font-bold text-sm">
                  {groupedByLevel.length} {groupedByLevel.length === 1 ? "مستوى" : "مستويات"}
                </span>
              </div>
            </div>
          </div>
          {/* دوائر زخرفية */}
          <div className="absolute -left-16 -top-16 w-72 h-72 bg-[#A8C8E8] rounded-full opacity-10 pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#FFF2DB] rounded-full opacity-5 pointer-events-none" />
        </div>

        {/* ── شريط الفلترة والأدوات ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-[fadeUp_0.45s_ease-out_both]">
          {/* حقل البحث */}
          <div className="relative flex-1">
            <Search className="absolute top-1/2 -translate-y-1/2 right-4 w-4 h-4 pointer-events-none" style={{ color: C.textM }} />
            <input
              type="text"
              placeholder="ابحث بالعنوان أو الوصف..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-11 pl-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all"
              style={{ backgroundColor: C.input, border: `2px solid ${C.border}`, color: C.textP }}
              onFocus={e => (e.target.style.borderColor = C.borderA)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </div>

          {/* فلتر المستوى */}
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

          {/* أزرار الإجراءات */}
          <div className="flex gap-2">
            <button
              onClick={() => { setShowAddForm(true); setEditingVideo(null); resetForm(); }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-md"
              style={{ backgroundColor: "#16a34a", color: "#fff" }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">إضافة فيديو</span>
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

        {/* ── نموذج الإضافة/التعديل ── */}
        {showAddForm && (
          <div
            className="rounded-2xl p-6 mb-6 animate-[fadeUp_0.3s_ease-out_both]"
            style={{ backgroundColor: C.card, border: `2px solid ${C.border}`, boxShadow: C.cardSh }}
          >
            <h3 className="text-lg font-extrabold mb-4" style={{ color: C.textP }}>
              {editingVideo ? "تعديل الفيديو" : "إضافة فيديو جديد"} 🎬
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* عنوان الفيديو */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1.5" style={{ color: C.textM }}>عنوان الفيديو *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
                  style={{ backgroundColor: C.input, border: `2px solid ${C.border}`, color: C.textP }}
                  onFocus={e => (e.target.style.borderColor = C.borderA)}
                  onBlur={e => (e.target.style.borderColor = C.border)}
                  placeholder="مثال: شرح درس المبتدأ والخبر"
                />
              </div>
              {/* رابط الفيديو */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: C.textM }}>رابط الفيديو (YouTube) *</label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
                  style={{ backgroundColor: C.input, border: `2px solid ${C.border}`, color: C.textP }}
                  onFocus={e => (e.target.style.borderColor = C.borderA)}
                  onBlur={e => (e.target.style.borderColor = C.border)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              {/* المستوى الدراسي */}
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
              {/* المدة */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: C.textM }}>المدة (اختياري)</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={e => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
                  style={{ backgroundColor: C.input, border: `2px solid ${C.border}`, color: C.textP }}
                  onFocus={e => (e.target.style.borderColor = C.borderA)}
                  onBlur={e => (e.target.style.borderColor = C.border)}
                  placeholder="مثال: 15:30"
                />
              </div>
              {/* الوصف */}
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
                  placeholder="وصف مختصر للفيديو التعليمي"
                />
              </div>

              {/* معاينة الصورة المصغرة */}
              {formData.videoUrl && getYouTubeThumbnail(formData.videoUrl) && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: C.textM }}>معاينة الصورة المصغرة</label>
                  <div className="w-full max-w-sm rounded-xl overflow-hidden border-2" style={{ borderColor: C.border }}>
                    <img
                      src={getYouTubeThumbnail(formData.videoUrl)!}
                      alt="معاينة"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* أزرار الحفظ والإلغاء */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={editingVideo ? handleEditVideo : handleAddVideo}
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

        {/* ── حالة التحميل ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 animate-[fadeUp_0.4s_ease-out_both]">
            <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: "#A8C8E8" }} />
            <p className="text-lg font-semibold" style={{ color: C.textM }}>جاري تحميل الفيديوهات...</p>
          </div>
        )}

        {/* ── رسالة خطأ ── */}
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

        {/* ── رسالة نجاح الحفظ ── */}
        {saveSuccess && (
          <div className="rounded-2xl p-4 mb-4 flex items-center gap-3 animate-[fadeUp_0.3s_ease-out_both]" style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "2px solid rgba(34,197,94,0.25)" }}>
            <Check className="w-5 h-5 text-green-500 shrink-0" />
            <p className="text-green-600 text-sm font-semibold">تم حفظ الفيديو بنجاح!</p>
          </div>
        )}

        {/* ── لا يوجد فيديوهات ── */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 animate-[fadeUp_0.4s_ease-out_both]">
            <VideoIcon className="w-16 h-16 mb-4 opacity-20" style={{ color: C.textM }} />
            <p className="text-lg font-bold mb-1" style={{ color: C.textS }}>لا يوجد فيديوهات</p>
            <p className="text-sm" style={{ color: C.textM }}>ابدأ بإضافة فيديوهات تعليمية جديدة.</p>
          </div>
        )}

        {/* ── عرض الفيديوهات مجمّعة حسب المستوى ── */}
        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-8 animate-[fadeUp_0.5s_ease-out_both]">
            {groupedByLevel.map(group => (
              <div key={group.level}>
                {/* عنوان المجموعة (المستوى) */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "rgba(168,200,232,0.15)" }}
                  >
                    <GraduationCap className="w-5 h-5" style={{ color: "#0A2947" }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold" style={{ color: C.textP }}>
                      {group.label}
                    </h3>
                    <p className="text-xs" style={{ color: C.textM }}>
                      {group.videos.length} {group.videos.length === 1 ? "فيديو" : "فيديوهات"}
                    </p>
                  </div>
                </div>

                {/* شبكة بطاقات الفيديوهات */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.videos.map((video, idx) => {
                    const videoId = video.id || video._id || idx;
                    const thumbnail = getYouTubeThumbnail(video.videoUrl);
                    const embedUrl = getYouTubeEmbedUrl(video.videoUrl);
                    const isPlaying = playingVideoId === videoId;

                    return (
                      <div
                        key={videoId}
                        className={`rounded-2xl overflow-hidden group ${tr}`}
                        style={{ backgroundColor: C.card, border: `2px solid ${C.border}`, boxShadow: C.cardSh }}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLDivElement;
                          el.style.borderColor = C.borderA;
                          el.style.boxShadow = C.cardHovSh;
                          el.style.transform = "translateY(-4px)";
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLDivElement;
                          el.style.borderColor = C.border;
                          el.style.boxShadow = C.cardSh;
                          el.style.transform = "translateY(0)";
                        }}
                      >
                        {/* صورة مصغرة / مشغّل الفيديو */}
                        <div className="relative w-full aspect-video overflow-hidden" style={{ backgroundColor: isDark ? "#1A2538" : "#f0f4f8" }}>
                          {isPlaying && embedUrl ? (
                            /* مشغّل YouTube مضمّن */
                            <iframe
                              src={`${embedUrl}?autoplay=1&rel=0`}
                              className="absolute inset-0 w-full h-full"
                              allow="autoplay; encrypted-media"
                              allowFullScreen
                              title={video.title || "فيديو"}
                            />
                          ) : thumbnail ? (
                            /* صورة مصغرة مع زر تشغيل */
                            <div
                              className="relative w-full h-full cursor-pointer"
                              onClick={() => setPlayingVideoId(videoId)}
                            >
                              <img
                                src={thumbnail}
                                alt={video.title || "فيديو"}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              {/* overlay تدريجي */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                              {/* زر التشغيل */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl transition-transform duration-300 group-hover:scale-110">
                                  <Play className="w-6 h-6 sm:w-7 sm:h-7 text-[#0A2947] mr-[-2px]" fill="#0A2947" />
                                </div>
                              </div>
                              {/* مدة الفيديو */}
                              {video.duration && (
                                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {video.duration}
                                </div>
                              )}
                            </div>
                          ) : (
                            /* لا يوجد صورة مصغرة — أيقونة بديلة */
                            <div className="w-full h-full flex items-center justify-center">
                              <VideoIcon className="w-12 h-12 opacity-20" style={{ color: C.textM }} />
                            </div>
                          )}
                        </div>

                        {/* محتوى البطاقة */}
                        <div className="p-4">
                          {/* عنوان + أزرار */}
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-extrabold text-sm leading-snug flex-1 ml-2" style={{ color: C.textP }}>
                              {video.title || "بدون عنوان"}
                            </h4>
                            <div className="flex gap-1.5 shrink-0">
                              <button
                                onClick={() => startEdit(video)}
                                className="p-1.5 rounded-lg transition-all hover:scale-110"
                                style={{ backgroundColor: "rgba(168,200,232,0.2)", color: "#0A2947" }}
                                title="تعديل"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteVideo(video)}
                                className="p-1.5 rounded-lg transition-all hover:scale-110"
                                style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#dc2626" }}
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              {video.videoUrl && (
                                <a
                                  href={video.videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg transition-all hover:scale-110"
                                  style={{ backgroundColor: "rgba(168,200,232,0.2)", color: "#0A2947" }}
                                  title="فتح في YouTube"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>

                          {/* المستوى */}
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold mb-2"
                            style={{ backgroundColor: "rgba(168,200,232,0.15)", color: "#0A2947" }}
                          >
                            {levelLabel(video.level)}
                          </span>

                          {/* الوصف */}
                          {video.description && (
                            <p className="text-xs line-clamp-2 mt-1" style={{ color: C.textS }}>
                              {video.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* إجمالي */}
            <p className="text-center text-xs mt-6" style={{ color: C.textM }}>
              عرض <strong>{filtered.length}</strong> من أصل <strong>{videos.length}</strong> فيديو
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
