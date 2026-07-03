/* ─────────────────────────────────────────────────────────────────────────────
   src/lib/api/levelTime.ts
   دوال API الخاصة بأوقات المستويات الدراسية

   الـ APIs المدعومة:
     POST   /level-time              — إضافة وقت لمستوى دراسي
     PUT    /level-time/:id          — تحديث وقت مستوى دراسي
     GET    /level-time              — جلب جميع أوقات المستويات (للمعلم)
     GET    /level-time/:level       — جلب وقت مستوى معين (للطالب)
     DELETE /level-time/:id          — حذف وقت مستوى دراسي

   كل طلب يرسل JWT token من localStorage في الـ Authorization header
───────────────────────────────────────────────────────────────────────────── */

import { API_URL } from "./config";
import { LEVEL_OPTIONS as STUDENT_LEVEL_OPTIONS } from "./students";

/* ── نوع بيانات وقت المستوى المُرجَعة من الـ API ── */
export interface LevelTime {
  _id?: string;
  id?: string | number;
  level: string;
  day: string;
  startTime: string;
  endTime: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/* ── payload إنشاء/تحديث وقت المستوى ── */
export interface LevelTimePayload {
  level: string;
  time: string; // ISO datetime format: "2026-07-30T10:00:00"
}

/* ── أيام الأسبوع المتاحة ── */
export const DAY_OPTIONS = [
  { value: "sunday", label: "الأحد" },
  { value: "monday", label: "الاثنين" },
  { value: "tuesday", label: "الثلاثاء" },
  { value: "wednesday", label: "الأربعاء" },
  { value: "thursday", label: "الخميس" },
  { value: "friday", label: "الجمعة" },
  { value: "saturday", label: "السبت" },
] as const;

/* ── إعادة تصدير خيارات المستويات من students.ts ── */
export const LEVEL_OPTIONS = STUDENT_LEVEL_OPTIONS;

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
    /* الـ API يتوقع: Authorization: <token>  (بدون كلمة Bearer) */
    ...(token ? { Authorization: token } : {}),
    ...extra,
  };
}

/* ── استخراج رسالة الخطأ من استجابة الـ API ── */
function getErrorMessage(data: Record<string, unknown>, fallback: string): string {
  const details = data?.errorDetails as { message?: string }[] | undefined;
  return (
    (data?.message as string) ||
    details?.[0]?.message ||
    fallback
  );
}

/* ── استخراج وقت المستوى من استجابة الـ API ── */
function extractLevelTime(data: Record<string, unknown>): LevelTime {
  const nestedData = data?.data as Record<string, unknown> | undefined;
  return nestedData?.levelTime as LevelTime
    ?? (data?.data as unknown as LevelTime)
    ?? (data?.levelTime as unknown as LevelTime)
    ?? (data as unknown as LevelTime);
}

/* ── استخراج قائمة أوقات المستويات من استجابة الـ API ── */
function extractLevelTimes(data: Record<string, unknown>): LevelTime[] {
  const nestedData = data?.data as Record<string, unknown> | undefined;
  const times = nestedData?.levelTimes as LevelTime[] | undefined
    ?? (data?.data as LevelTime[] | undefined)
    ?? (data?.levelTimes as LevelTime[] | undefined)
    ?? (data as unknown as LevelTime[] | undefined);
  
  const list = Array.isArray(times) ? times : [];
  return list as LevelTime[];
}

/* ────────────────────────────────────────────────────────────────────────────
   addLevelTime — إضافة وقت لمستوى دراسي
   POST /level-time
────────────────────────────────────────────────────────────────────────────── */
export async function addLevelTime(payload: LevelTimePayload): Promise<LevelTime> {
  const res = await fetch(`${API_URL}/level-time`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ levelTime: payload }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getErrorMessage(data, "فشل في إضافة وقت المستوى."));

  return extractLevelTime(data);
}

/* ────────────────────────────────────────────────────────────────────────────
   updateLevelTime — تحديث وقت مستوى دراسي
   PUT /level-time/:id
────────────────────────────────────────────────────────────────────────────── */
export async function updateLevelTime(
  levelTimeId: string,
  payload: LevelTimePayload
): Promise<LevelTime> {
  const res = await fetch(`${API_URL}/level-time/${levelTimeId}`, {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify({ levelTime: payload }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getErrorMessage(data, "فشل في تحديث وقت المستوى."));

  return extractLevelTime(data);
}

/* ────────────────────────────────────────────────────────────────────────────
   getAllLevelTimes — جلب جميع أوقات المستويات (للمعلم)
   GET /level-time
────────────────────────────────────────────────────────────────────────────── */
export async function getAllLevelTimes(): Promise<LevelTime[]> {
  const res = await fetch(`${API_URL}/level-time`, {
    method: "GET",
    headers: buildHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getErrorMessage(data, "فشل في جلب أوقات المستويات."));
  
  return extractLevelTimes(data);
}

/* ────────────────────────────────────────────────────────────────────────────
   getLevelTimeByLevel — جلب وقت مستوى معين (للطالب)
   GET /level-time/:level
────────────────────────────────────────────────────────────────────────────── */
export async function getLevelTimeByLevel(level: string): Promise<LevelTime[]> {
  const res = await fetch(`${API_URL}/level-time/${level}`, {
    method: "GET",
    headers: buildHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getErrorMessage(data, "فشل في جلب وقت المستوى."));
  
  const times = extractLevelTimes(data);
  
  // إذا كانت الاستجابة كائن واحد وليست مصفوفة
  if (!Array.isArray(times) && typeof times === 'object') {
    return [times as LevelTime];
  }
  
  return times;
}

/* ────────────────────────────────────────────────────────────────────────────
   deleteLevelTime — حذف وقت مستوى دراسي
   DELETE /level-time/:id
────────────────────────────────────────────────────────────────────────────── */
export async function deleteLevelTime(levelTimeId: string): Promise<void> {
  const res = await fetch(`${API_URL}/level-time/${levelTimeId}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(getErrorMessage(data, "فشل في حذف وقت المستوى."));
  }
}

/* ── دالة مساعدة للحصول على اسم المستوى بالعربي ── */
export function getLevelLabel(levelValue: string): string {
  const level = LEVEL_OPTIONS.find((l: { value: string; label: string }) => l.value === levelValue);
  return level?.label || levelValue;
}

/* ── دالة مساعدة للحصول على اسم اليوم بالعربي ── */
export function getDayLabel(dayValue: string): string {
  const day = DAY_OPTIONS.find((d: { value: string; label: string }) => d.value === dayValue);
  return day?.label || dayValue;
}
