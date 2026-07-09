/* ─────────────────────────────────────────────────────────────────────────────
   src/lib/api/videos.ts
   دوال API الخاصة بالفيديوهات التعليمية

   الميزات:
     - تخزين محلي (localStorage) للفيديوهات
     - بيانات تجريبية تُحمَّل تلقائياً أول مرة
     - CRUD كامل: جلب، إضافة، تعديل، حذف
     - فلترة حسب المستوى الدراسي
     - جلب فيديوهات الطالب حسب مستواه

   كل طلب يرسل JWT token من localStorage في الـ Authorization header
───────────────────────────────────────────────────────────────────────────── */

import { API_URL } from "./config";

/* ── نوع بيانات الفيديو ── */
export interface Video {
  id?: string | number;
  _id?: string;
  title?: string;           /* عنوان الفيديو */
  description?: string;     /* وصف مختصر */
  videoUrl?: string;        /* رابط الفيديو (YouTube أو رابط مباشر) */
  level?: string;           /* المستوى الدراسي */
  thumbnailUrl?: string;    /* صورة مصغرة اختيارية */
  duration?: string;        /* مدة الفيديو (اختياري) */
  createdAt?: string;       /* تاريخ الإنشاء */
  [key: string]: unknown;
}

/* ── مفتاح التخزين المحلي ── */
const VIDEOS_LOCAL_DB = "sms_videos_db";
/* مفتاح لمعرفة إن كانت الأمثلة قد حُمِّلت من قبل */
const VIDEOS_SEEDED = "sms_videos_seeded";

/* ── البيانات التجريبية (أمثلة) — تُحمَّل أول مرة ── */
const SEED_VIDEOS: Video[] = [
  {
    id: "seed-1",
    title: "الحروف الأبجدية العربية",
    description: "تعلّم الحروف العربية بطريقة ممتعة وتفاعلية مع أمثلة ونطق صحيح لكل حرف.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    level: "one",
    duration: "12:30",
    createdAt: "2025-09-01T08:00:00.000Z",
  },
  {
    id: "seed-2",
    title: "الأرقام من ١ إلى ١٠",
    description: "درس تفاعلي لتعلم الأرقام العربية من واحد إلى عشرة مع تمارين عملية.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    level: "one",
    duration: "08:45",
    createdAt: "2025-09-05T10:00:00.000Z",
  },
  {
    id: "seed-3",
    title: "القراءة والتهجئة — المستوى الثالث",
    description: "تمارين القراءة والتهجئة للصف الثالث الابتدائي مع نصوص قصيرة.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    level: "three",
    duration: "15:20",
    createdAt: "2025-10-01T09:00:00.000Z",
  },
  {
    id: "seed-4",
    title: "النحو العربي — المبتدأ والخبر",
    description: "شرح مفصّل لقواعد المبتدأ والخبر مع أمثلة توضيحية وتمارين.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    level: "six",
    duration: "22:10",
    createdAt: "2025-10-15T11:00:00.000Z",
  },
  {
    id: "seed-5",
    title: "الجبر — حل المعادلات من الدرجة الأولى",
    description: "درس رياضيات: كيفية حل المعادلات البسيطة خطوة بخطوة.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    level: "seven",
    duration: "18:55",
    createdAt: "2025-11-01T08:30:00.000Z",
  },
  {
    id: "seed-6",
    title: "الفيزياء — قوانين نيوتن للحركة",
    description: "شرح قوانين نيوتن الثلاثة مع تجارب عملية وأمثلة من الحياة اليومية.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    level: "ten",
    duration: "25:40",
    createdAt: "2025-11-10T14:00:00.000Z",
  },
];

/* ── دالة تحميل البيانات التجريبية (مرة واحدة فقط) ── */
function seedIfNeeded() {
  if (typeof window === "undefined") return;
  const alreadySeeded = localStorage.getItem(VIDEOS_SEEDED);
  if (alreadySeeded) return;

  /* نحمّل الأمثلة فقط إذا لم يكن هناك بيانات سابقة */
  const existing = getLocalVideos();
  if (existing.length === 0) {
    saveLocalVideos(SEED_VIDEOS);
  }
  localStorage.setItem(VIDEOS_SEEDED, "true");
}

/* ── قراءة الفيديوهات من التخزين المحلي ── */
function getLocalVideos(): Video[] {
  if (typeof window === "undefined") return [];
  try {
    const db = localStorage.getItem(VIDEOS_LOCAL_DB);
    return db ? JSON.parse(db) : [];
  } catch { return []; }
}

/* ── حفظ الفيديوهات في التخزين المحلي ── */
function saveLocalVideos(videos: Video[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VIDEOS_LOCAL_DB, JSON.stringify(videos));
  } catch {}
}

/* ── استخراج الـ token من localStorage بأمان ── */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/* ── بناء headers موحّدة مع Authorization ── */
function buildHeaders(extra: Record<string, string> = {}): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: token } : {}),
    ...extra,
  };
}

/* ── استخراج YouTube Video ID من الرابط ── */
export function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  /* دعم الأشكال المتعددة لروابط YouTube */
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/* ── استخراج صورة YouTube المصغرة ── */
export function getYouTubeThumbnail(url?: string): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}

/* ── بناء رابط YouTube embed ── */
export function getYouTubeEmbedUrl(url?: string): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
}

/* ────────────────────────────────────────────────────────────────────────────
   getVideos — جلب قائمة الفيديوهات للمعلم
   يحاول جلبها من الـ API أولاً، ثم يلجأ للتخزين المحلي
──────────────────────────────────────────────────────────────────────────── */
export async function getVideos(): Promise<Video[]> {
  /* نتأكد من تحميل البيانات التجريبية */
  seedIfNeeded();

  try {
    const res = await fetch(`${API_URL}/admin/videos`, {
      method: "GET",
      headers: buildHeaders(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.message || "فشل في جلب الفيديوهات.");
    }

    let videos = data?.data?.videos ?? data?.data ?? data?.videos ?? data;
    if (!Array.isArray(videos)) videos = [];
    return videos;
  } catch {
    /* إذا فشل الـ API، نرجع البيانات المحلية */
    return getLocalVideos();
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   getVideosByLevel — جلب الفيديوهات حسب المستوى
──────────────────────────────────────────────────────────────────────────── */
export async function getVideosByLevel(level: string): Promise<Video[]> {
  seedIfNeeded();

  try {
    const res = await fetch(`${API_URL}/admin/videos/level/${level}`, {
      method: "GET",
      headers: buildHeaders(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.message || "فشل في جلب فيديوهات هذا المستوى.");
    }

    let videos = data?.data?.videos ?? data?.data ?? data?.videos ?? data;
    if (!Array.isArray(videos)) videos = [];
    return videos;
  } catch {
    /* فلترة محلية حسب المستوى */
    return getLocalVideos().filter(v => v.level === level);
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   addVideo — إضافة فيديو جديد
──────────────────────────────────────────────────────────────────────────── */
export async function addVideo(
  video: Omit<Video, "id" | "_id" | "createdAt">
): Promise<Video> {
  /* تخزين محلي مباشرة */
  const newVideo: Video = {
    ...video,
    id: Date.now(),
    createdAt: new Date().toISOString(),
  };
  const videos = getLocalVideos();
  videos.push(newVideo);
  saveLocalVideos(videos);
  return newVideo;
}

/* ────────────────────────────────────────────────────────────────────────────
   updateVideo — تحديث فيديو
──────────────────────────────────────────────────────────────────────────── */
export async function updateVideo(
  videoId: string | number,
  video: Partial<Video>
): Promise<Video> {
  const videos = getLocalVideos();
  const idx = videos.findIndex(v => String(v.id || v._id) === String(videoId));
  if (idx > -1) {
    videos[idx] = { ...videos[idx], ...video };
    saveLocalVideos(videos);
    return videos[idx];
  }
  throw new Error("لم يتم العثور على الفيديو.");
}

/* ────────────────────────────────────────────────────────────────────────────
   deleteVideo — حذف فيديو
──────────────────────────────────────────────────────────────────────────── */
export async function deleteVideo(videoId: string | number): Promise<void> {
  const videos = getLocalVideos();
  const filtered = videos.filter(v => String(v.id || v._id) !== String(videoId));
  saveLocalVideos(filtered);
}

/* ────────────────────────────────────────────────────────────────────────────
   getStudentVideos — جلب الفيديوهات المتاحة للطالب (حسب مستواه)
──────────────────────────────────────────────────────────────────────────── */
export async function getStudentVideos(): Promise<Video[]> {
  seedIfNeeded();

  try {
    const res = await fetch(`${API_URL}/student/videos`, {
      method: "GET",
      headers: buildHeaders(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.message || "فشل في جلب الفيديوهات.");
    }

    let videos = data?.data?.videos ?? data?.data ?? data?.videos ?? data;
    if (!Array.isArray(videos)) videos = [];
    return videos;
  } catch {
    /* إذا فشل الـ API، نفلتر من البيانات المحلية حسب مستوى الطالب */
    const user = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!user) return getLocalVideos(); /* إذا لا يوجد مستخدم، نعرض الكل */
    try {
      const userData = JSON.parse(user);
      const studentLevel = userData.level;
      if (!studentLevel) return getLocalVideos();
      return getLocalVideos().filter(v => v.level === studentLevel);
    } catch { return getLocalVideos(); }
  }
}
