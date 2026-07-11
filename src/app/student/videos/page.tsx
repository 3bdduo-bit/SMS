"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   src/app/student/videos/page.tsx
   صفحة مشاهدة الفيديوهات التعليمية — خاصة بالطالب

   الميزات:
   - عرض الفيديوهات المتاحة لمستوى الطالب
   - مشغّل YouTube مضمّن مباشرة في الصفحة
   - صور مصغرة تلقائية من YouTube
   - بحث نصي بالعنوان والوصف
   - تصميم مريح ومتجاوب
   - دعم الوضع الليلي + RTL + اللغة العربية
───────────────────────────────────────────────────────────────────────────── */

import {
  Video as VideoIcon, Search, GraduationCap, LogOut,
  AlertCircle, Loader2, X, Play, Clock, ExternalLink,
  Menu, ChevronLeft
, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { getProfile, UserProfile } from "@/lib/api/user";
import { LEVEL_OPTIONS } from "@/lib/api/students";
import {
  getStudentVideos, Video, getYouTubeThumbnail, getYouTubeEmbedUrl
} from "@/lib/api/videos";
import { useTheme } from "@/components/ThemeProvider";
import { getColors } from "@/lib/theme/colors";
import ThemeToggle from "@/components/ThemeToggle";

/* ════════════════════════════════════════════════════════════════════════════
   المكوّن الرئيسي
════════════════════════════════════════════════════════════════════════════ */
export default function StudentVideosPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);

  /* ── الحالات ── */
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* بحث */
  const [searchQuery, setSearchQuery] = useState("");

  /* حالة عرض الفيديو (أي فيديو يُعرض في المشغّل الكبير) */
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /* ── transition مشترك ── */
  const tr = "transition-all duration-300 ease-in-out";

  /* ── جلب الملف الشخصي ── */
  useEffect(() => {
    getProfile().then(p => setProfile(p)).catch(() => {});
  }, []);

  /* ── جلب الفيديوهات ── */
  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getStudentVideos();
        setVideos(data);
      } catch (err) {
        setError((err as Error).message || "فشل في تحميل الفيديوهات.");
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  /* ── تسجيل الخروج ── */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  /* ── الحرف الأول للأفاتار ── */
  const getInitial = () => {
    if (!profile) return "م";
    return (profile.fullName ?? profile.name ?? profile.userName ?? "م").charAt(0).toUpperCase();
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

  /* ── اسم المستوى ── */
  const levelLabel = (val?: string) =>
    LEVEL_OPTIONS.find(l => l.value === val)?.label ?? (val ?? "—");

  /* ── تجميع حسب المستوى ── */
  const groupedByLevel = useMemo(() => {
    const groups: Record<string, Video[]> = {};
    for (const v of filtered) {
      const lvl = v.level || "unknown";
      if (!groups[lvl]) groups[lvl] = [];
      groups[lvl].push(v);
    }
    const ordered: { level: string; label: string; videos: Video[] }[] = [];
    for (const opt of LEVEL_OPTIONS) {
      if (groups[opt.value]) {
        ordered.push({ level: opt.value, label: opt.label, videos: groups[opt.value] });
      }
    }
    if (groups["unknown"]) {
      ordered.push({ level: "unknown", label: "بدون مستوى", videos: groups["unknown"] });
    }
    return ordered;
  }, [filtered]);

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
            href="/student"
            className="p-2 rounded-xl hover:bg-black/5 transition-colors group flex items-center justify-center"
            title="العودة للرئيسية"
          >
            <Home className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" style={{ color: C.textP }} />
          </Link>
          <Link href="/student" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#0A2947] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <VideoIcon className="text-[#A8C8E8] w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight leading-none" style={{ color: C.textP }}>
              بوابة الطالب
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

          {/* أفاتار الطالب */}
          <div
            className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#A8C8E8] items-center justify-center text-[#0A2947] font-extrabold text-sm shadow-inner select-none"
            title="الملف الشخصي"
          >
            {getInitial()}
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

      {/* ════════════ المحتوى الرئيسي ════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* ── بانر علوي (Hero) ── */}
        <div
          className={`relative rounded-3xl p-6 sm:p-10 text-white mb-8 overflow-hidden shadow-2xl animate-[fadeUp_0.4s_ease-out_both] ${tr}`}
          style={{ backgroundColor: C.hero }}
        >
          <div className="relative z-10">
            <p className="text-[#A8C8E8] text-xs sm:text-sm font-semibold mb-2 tracking-widest uppercase">
              منصة SMS التعليمية — الفيديوهات
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 text-[#FFFAF3]">
              الفيديوهات التعليمية 🎬
            </h2>
            <p className="text-[#A8C8E8]/90 text-sm mb-4">
              شاهد الفيديوهات التعليمية الخاصة بمستواك الدراسي. تعلّم في أي وقت وأي مكان!
            </p>
            {/* إحصائيات */}
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2">
                <VideoIcon className="w-4 h-4 text-[#A8C8E8]" />
                <span className="text-white font-bold text-sm">{videos.length} فيديو متاح</span>
              </div>
            </div>
          </div>
          {/* دوائر زخرفية */}
          <div className="absolute -left-16 -top-16 w-72 h-72 bg-[#A8C8E8] rounded-full opacity-10 pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#FFF2DB] rounded-full opacity-5 pointer-events-none" />
        </div>

        {/* ── المشغّل الكبير (عند اختيار فيديو) ── */}
        {activeVideo && (
          <div className="mb-8 animate-[fadeUp_0.3s_ease-out_both]">
            <div
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{ border: `2px solid ${C.borderA}` }}
            >
              {/* مشغّل الفيديو */}
              <div className="relative w-full aspect-video" style={{ backgroundColor: isDark ? "#0D1520" : "#000" }}>
                {getYouTubeEmbedUrl(activeVideo.videoUrl) ? (
                  <iframe
                    src={`${getYouTubeEmbedUrl(activeVideo.videoUrl)}?autoplay=1&rel=0`}
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                    title={activeVideo.title || "فيديو"}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-white/50 text-sm">لا يمكن تشغيل هذا الفيديو</p>
                  </div>
                )}
              </div>

              {/* معلومات الفيديو */}
              <div className="p-5" style={{ backgroundColor: C.card }}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg sm:text-xl font-extrabold flex-1 ml-3" style={{ color: C.textP }}>
                    {activeVideo.title}
                  </h3>
                  <button
                    onClick={() => setActiveVideo(null)}
                    className="p-2 rounded-xl transition-all hover:scale-110 shrink-0"
                    style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#dc2626" }}
                    title="إغلاق المشغّل"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold"
                    style={{ backgroundColor: "rgba(168,200,232,0.15)", color: "#0A2947" }}
                  >
                    <GraduationCap className="w-3 h-3" />
                    {levelLabel(activeVideo.level)}
                  </span>
                  {activeVideo.duration && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.textM }}>
                      <Clock className="w-3 h-3" />
                      {activeVideo.duration}
                    </span>
                  )}
                  {activeVideo.videoUrl && (
                    <a
                      href={activeVideo.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                      style={{ color: "#A8C8E8" }}
                    >
                      <ExternalLink className="w-3 h-3" />
                      فتح في YouTube
                    </a>
                  )}
                </div>
                {activeVideo.description && (
                  <p className="text-sm leading-relaxed" style={{ color: C.textS }}>
                    {activeVideo.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── حقل البحث ── */}
        <div className="mb-6 animate-[fadeUp_0.45s_ease-out_both]">
          <div className="relative max-w-xl">
            <Search className="absolute top-1/2 -translate-y-1/2 right-4 w-4 h-4 pointer-events-none" style={{ color: C.textM }} />
            <input
              type="text"
              placeholder="ابحث عن فيديو..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-11 pl-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all"
              style={{ backgroundColor: C.input, border: `2px solid ${C.border}`, color: C.textP }}
              onFocus={e => (e.target.style.borderColor = C.borderA)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </div>
        </div>

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

        {/* ── لا يوجد فيديوهات ── */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 animate-[fadeUp_0.4s_ease-out_both]">
            <VideoIcon className="w-16 h-16 mb-4 opacity-20" style={{ color: C.textM }} />
            <p className="text-lg font-bold mb-1" style={{ color: C.textS }}>لا يوجد فيديوهات</p>
            <p className="text-sm" style={{ color: C.textM }}>لم يتم إضافة فيديوهات لمستواك بعد.</p>
          </div>
        )}

        {/* ── عرض الفيديوهات ── */}
        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-8 animate-[fadeUp_0.5s_ease-out_both]">
            {groupedByLevel.map(group => (
              <div key={group.level}>
                {/* عنوان المجموعة */}
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
                    const isActive = activeVideo && (activeVideo.id || activeVideo._id) === videoId;

                    return (
                      <div
                        key={videoId}
                        className={`rounded-2xl overflow-hidden group cursor-pointer ${tr}`}
                        style={{
                          backgroundColor: C.card,
                          border: `2px solid ${isActive ? C.borderA : C.border}`,
                          boxShadow: isActive ? C.cardHovSh : C.cardSh,
                        }}
                        onClick={() => {
                          setActiveVideo(video);
                          /* التمرير لأعلى لرؤية المشغّل */
                          window.scrollTo({ top: 300, behavior: "smooth" });
                        }}
                        onMouseEnter={e => {
                          if (!isActive) {
                            const el = e.currentTarget as HTMLDivElement;
                            el.style.borderColor = C.borderA;
                            el.style.boxShadow = C.cardHovSh;
                            el.style.transform = "translateY(-4px)";
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isActive) {
                            const el = e.currentTarget as HTMLDivElement;
                            el.style.borderColor = C.border;
                            el.style.boxShadow = C.cardSh;
                            el.style.transform = "translateY(0)";
                          }
                        }}
                      >
                        {/* صورة مصغرة */}
                        <div className="relative w-full aspect-video overflow-hidden" style={{ backgroundColor: isDark ? "#1A2538" : "#f0f4f8" }}>
                          {thumbnail ? (
                            <div className="relative w-full h-full">
                              <img
                                src={thumbnail}
                                alt={video.title || "فيديو"}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              {/* overlay تدريجي */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                              {/* زر التشغيل */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl transition-transform duration-300 group-hover:scale-110">
                                  <Play className="w-5 h-5 sm:w-6 sm:h-6 text-[#0A2947] mr-[-2px]" fill="#0A2947" />
                                </div>
                              </div>
                              {/* مدة الفيديو */}
                              {video.duration && (
                                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {video.duration}
                                </div>
                              )}
                              {/* شارة "قيد المشاهدة" */}
                              {isActive && (
                                <div className="absolute top-2 right-2 bg-[#0A2947] text-[#A8C8E8] text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                                  <Play className="w-3 h-3" fill="#A8C8E8" />
                                  قيد المشاهدة
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <VideoIcon className="w-12 h-12 opacity-20" style={{ color: C.textM }} />
                            </div>
                          )}
                        </div>

                        {/* محتوى البطاقة */}
                        <div className="p-4">
                          <h4 className="font-extrabold text-sm leading-snug mb-2" style={{ color: C.textP }}>
                            {video.title || "بدون عنوان"}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
                              style={{ backgroundColor: "rgba(168,200,232,0.15)", color: "#0A2947" }}
                            >
                              {levelLabel(video.level)}
                            </span>
                            {video.duration && (
                              <span className="inline-flex items-center gap-1 text-xs" style={{ color: C.textM }}>
                                <Clock className="w-3 h-3" />
                                {video.duration}
                              </span>
                            )}
                          </div>
                          {video.description && (
                            <p className="text-xs line-clamp-2" style={{ color: C.textS }}>
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
              إجمالي <strong>{filtered.length}</strong> فيديو متاح
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
