/* ─────────────────────────────────────────────────────────────────────────────
   src/lib/api/levelTime.ts
   دوال API الخاصة بأوقات المستويات الدراسية — النسخة المصححة

   الـ APIs المدعومة (طبقاً لصور Postman):
     POST   /level-time               — إضافة وقت لمستوى دراسي
     PATCH  /level-time/:id           — تحديث وقت مستوى دراسي
     GET    /level-time               — جلب جميع أوقات المستويات (للمعلم/الأدمن)
     GET    /level-time/:level        — جلب وقت مستوى معين (للطالب)
     DELETE /level-time/:id           — حذف وقت مستوى دراسي

   الـ Backend يتوقع: { level: string, time: string }
   حيث time = ISO datetime مثل "2026-07-30T10:00:00"

   كل طلب يرسل JWT token من localStorage في الـ Authorization header
───────────────────────────────────────────────────────────────────────────── */

import { API_URL } from "./config";
import { LEVEL_OPTIONS as STUDENT_LEVEL_OPTIONS } from "./students";

/* ── نوع بيانات وقت المستوى المُرجَعة من الـ API ── */
export interface LevelTime {
  _id?: string;
  id?: string | number;
  level: string;
  time: string; // ISO datetime: "2026-07-30T10:00:00"
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/* ── payload إنشاء/تحديث وقت المستوى ── */
export interface LevelTimePayload {
  level: string;
  time: string; // ISO datetime format: "2026-07-30T10:00:00"
}

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
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
   Body: { level: "three", time: "2026-07-30T10:00:00" }
────────────────────────────────────────────────────────────────────────────── */
export async function addLevelTime(payload: LevelTimePayload): Promise<LevelTime> {
  const res = await fetch(`${API_URL}/level-time`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getErrorMessage(data, "فشل في إضافة وقت المستوى."));

  return extractLevelTime(data);
}

/* ────────────────────────────────────────────────────────────────────────────
   updateLevelTime — تحديث وقت مستوى دراسي
   PATCH /level-time/:id
   Body: { level: "three", time: "2026-07-30T10:00:00" }
────────────────────────────────────────────────────────────────────────────── */
export async function updateLevelTime(
  levelTimeId: string,
  payload: LevelTimePayload
): Promise<LevelTime> {
  const res = await fetch(`${API_URL}/level-time/${levelTimeId}`, {
    method: "PATCH", 
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getErrorMessage(data, "فشل في تحديث وقت المستوى."));

  return extractLevelTime(data);
}

/* ────────────────────────────────────────────────────────────────────────────
   getAllLevelTimes — جلب جميع أوقات المستويات (للمعلم / الأدمن)
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
  if (!Array.isArray(times) && typeof times === 'object' && times !== null) {
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

/* ════════════════════════════════════════════════════════════════════════════
   دوال مساعدة للعرض — تحليل ISO datetime لاستخراج المعلومات
════════════════════════════════════════════════════════════════════════════ */

/* ── أيام الأسبوع بالعربي ── */
const ARABIC_DAYS = [
  "الأحد", "الاثنين", "الثلاثاء", "الأربعاء",
  "الخميس", "الجمعة", "السبت"
] as const;

/* ── أسماء الأشهر بالعربي ── */
const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
] as const;

/* ── استخراج اسم اليوم بالعربي من ISO datetime ── */
export function getDayFromTime(isoTime: string): string {
  try {
    const date = new Date(isoTime);
    if (isNaN(date.getTime())) return "—";
    return ARABIC_DAYS[date.getDay()];
  } catch {
    return "—";
  }
}

/* ── استخراج التاريخ المنسق بالعربي من ISO datetime ── */
export function getFormattedDate(isoTime: string): string {
  try {
    const date = new Date(isoTime);
    if (isNaN(date.getTime())) return "—";
    const day = date.getDate();
    const month = ARABIC_MONTHS[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return "—";
  }
}

/* ── استخراج الوقت المنسق (ساعة:دقيقة) من ISO datetime ── */
export function getFormattedTime(isoTime: string): string {
  try {
    const date = new Date(isoTime);
    if (isNaN(date.getTime())) return "—";
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch {
    return "—";
  }
}

/* ── استخراج الوقت بصيغة 12 ساعة مع ص/م ── */
export function getFormattedTime12(isoTime: string): string {
  try {
    const date = new Date(isoTime);
    if (isNaN(date.getTime())) return "—";
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const period = hours >= 12 ? "م" : "ص";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${period}`;
  } catch {
    return "—";
  }
}

/* ── تحويل datetime-local value إلى ISO string للـ API ── */
export function datetimeLocalToISO(datetimeLocal: string): string {
  // datetime-local format: "2026-07-30T10:00"
  // API expects: "2026-07-30T10:00:00"
  if (!datetimeLocal) return "";
  // إضافة الثواني إذا لم تكن موجودة
  return datetimeLocal.length === 16 ? `${datetimeLocal}:00` : datetimeLocal;
}

/* ── تحويل ISO string إلى datetime-local value للنموذج ── */
export function isoToDatetimeLocal(isoTime: string): string {
  if (!isoTime) return "";
  try {
    const date = new Date(isoTime);
    if (isNaN(date.getTime())) return "";
    // نحتاج التنسيق: "YYYY-MM-DDTHH:MM"
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return "";
  }
}

/* ── دالة مساعدة للحصول على اسم المستوى بالعربي ── */
export function getLevelLabel(levelValue: string): string {
  const level = LEVEL_OPTIONS.find((l: { value: string; label: string }) => l.value === levelValue);
  return level?.label || levelValue;
}