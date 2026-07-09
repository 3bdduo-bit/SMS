/* ─────────────────────────────────────────────────────────────────────────────
   src/lib/api/levelTime.ts
   دوال API الخاصة بأوقات المستويات الدراسية — أوقات أسبوعية ثابتة

   الـ APIs المدعومة:
     POST   /level-time               — إضافة وقت لمستوى دراسي
     PATCH  /level-time/:id           — تحديث وقت مستوى دراسي
     GET    /level-time               — جلب جميع أوقات المستويات (للمعلم/الأدمن)
     GET    /level-time/:level        — جلب وقت مستوى معين (للطالب)
     DELETE /level-time/:id           — حذف وقت مستوى دراسي

   الـ Backend يتوقع: { level: string, time: string }
   حيث time = "HH:MM" أو "DayName HH:MM" حسب ما يقبله الـ Backend
   (الوقت الأسبوعي الثابت — بدون تاريخ)
───────────────────────────────────────────────────────────────────────────── */

import { API_URL } from "./config";
import { LEVEL_OPTIONS as STUDENT_LEVEL_OPTIONS } from "./students";

/* ═══════════════════════════════════════════════════════════════════════════
   أيام الأسبوع — ثابتة لا تتغير
═══════════════════════════════════════════════════════════════════════════ */
export const DAY_OPTIONS = [
  { value: "sunday",    label: "الأحد" },
  { value: "monday",    label: "الاثنين" },
  { value: "tuesday",   label: "الثلاثاء" },
  { value: "wednesday", label: "الأربعاء" },
  { value: "thursday",  label: "الخميس" },
  { value: "friday",    label: "الجمعة" },
  { value: "saturday",  label: "السبت" },
] as const;

export type DayValue = (typeof DAY_OPTIONS)[number]["value"];

/* ── نوع بيانات وقت المستوى المُرجَعة من الـ API ── */
export interface LevelTime {
  _id?: string;
  id?: string | number;
  level: string;
  day: string;   // يوم الأسبوع: "sunday" | "monday" | ...
  time: string;  // الوقت فقط: "HH:MM"
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/* ── payload إنشاء/تحديث وقت المستوى ── */
export interface LevelTimePayload {
  level: string;
  day: string;  // يوم الأسبوع
  time: string; // الوقت: "HH:MM"
}

/* ── إعادة تصدير خيارات المستويات من students.ts ── */
export const LEVEL_OPTIONS = STUDENT_LEVEL_OPTIONS;

/* ════════════════════════════════════════════════════════════════════════════
   قاعدة بيانات محلية (fallback عند فشل الـ API)
════════════════════════════════════════════════════════════════════════════ */
const LEVEL_TIMES_LOCAL_DB = "sms_level_times_db_v2"; // v2 لتجنب تعارض البيانات القديمة
const LEVEL_TIMES_SEEDED   = "sms_level_times_seeded_v2";

function getLocalLevelTimes(): LevelTime[] {
  if (typeof window === "undefined") return [];
  try {
    const db = localStorage.getItem(LEVEL_TIMES_LOCAL_DB);
    return db ? JSON.parse(db) : [];
  } catch { return []; }
}

function saveLocalLevelTimes(times: LevelTime[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LEVEL_TIMES_LOCAL_DB, JSON.stringify(times));
  } catch {}
}

/* ── بيانات أولية تجريبية (أوقات أسبوعية ثابتة) ── */
const SEED_LEVEL_TIMES: LevelTime[] = [
  {
    _id: "seed-lt1",
    level: "seven",
    day:  "sunday",
    time: "08:00",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "seed-lt2",
    level: "seven",
    day:  "tuesday",
    time: "10:30",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "seed-lt3",
    level: "ten",
    day:  "monday",
    time: "09:00",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function seedIfNeeded() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(LEVEL_TIMES_SEEDED)) return;
  if (getLocalLevelTimes().length === 0) {
    saveLocalLevelTimes(SEED_LEVEL_TIMES);
  }
  localStorage.setItem(LEVEL_TIMES_SEEDED, "true");
}

/* ════════════════════════════════════════════════════════════════════════════
   دوال مساعدة للـ HTTP
════════════════════════════════════════════════════════════════════════════ */

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function buildHeaders(extra: Record<string, string> = {}): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

function getErrorMessage(data: Record<string, unknown>, fallback: string): string {
  const details = data?.errorDetails as { message?: string }[] | undefined;
  return (data?.message as string) || details?.[0]?.message || fallback;
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
  return Array.isArray(times) ? (times as LevelTime[]) : [];
}

/* ════════════════════════════════════════════════════════════════════════════
   دوال API العامة
════════════════════════════════════════════════════════════════════════════ */

/* ─── إضافة وقت لمستوى دراسي ─── */
export async function addLevelTime(payload: LevelTimePayload): Promise<LevelTime> {
  try {
    const res = await fetch(`${API_URL}/level-time`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(getErrorMessage(data, "فشل في إضافة وقت المستوى."));
    return extractLevelTime(data);
  } catch {
    /* fallback محلي */
    const times = getLocalLevelTimes();
    const newTime: LevelTime = {
      ...payload,
      _id: "local-lt-" + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    times.push(newTime);
    saveLocalLevelTimes(times);
    return newTime;
  }
}

/* ─── تحديث وقت مستوى دراسي ─── */
export async function updateLevelTime(
  levelTimeId: string,
  payload: LevelTimePayload
): Promise<LevelTime> {
  try {
    const res = await fetch(`${API_URL}/level-time/${levelTimeId}`, {
      method: "PATCH",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(getErrorMessage(data, "فشل في تحديث وقت المستوى."));
    return extractLevelTime(data);
  } catch {
    const times = getLocalLevelTimes();
    const idx = times.findIndex(t => String(t._id || t.id) === String(levelTimeId));
    if (idx > -1) {
      times[idx] = { ...times[idx], ...payload, updatedAt: new Date().toISOString() };
      saveLocalLevelTimes(times);
      return times[idx];
    }
    throw new Error("لم يتم العثور على وقت المستوى.");
  }
}

/* ─── جلب جميع أوقات المستويات (للمعلم / الأدمن) ─── */
export async function getAllLevelTimes(): Promise<LevelTime[]> {
  seedIfNeeded();
  try {
    const res = await fetch(`${API_URL}/level-time`, {
      method: "GET",
      headers: buildHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(getErrorMessage(data, "فشل في جلب أوقات المستويات."));
    return extractLevelTimes(data);
  } catch {
    return getLocalLevelTimes();
  }
}

/* ─── جلب وقت مستوى معين (للطالب) ─── */
export async function getLevelTimeByLevel(level: string): Promise<LevelTime[]> {
  seedIfNeeded();
  try {
    const res = await fetch(`${API_URL}/level-time/${level}`, {
      method: "GET",
      headers: buildHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(getErrorMessage(data, "فشل في جلب وقت المستوى."));
    const times = extractLevelTimes(data);
    if (!Array.isArray(times) && typeof times === "object" && times !== null) {
      return [times as LevelTime];
    }
    return times;
  } catch {
    return getLocalLevelTimes().filter(t => t.level === level);
  }
}

/* ─── حذف وقت مستوى دراسي ─── */
export async function deleteLevelTime(levelTimeId: string): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/level-time/${levelTimeId}`, {
      method: "DELETE",
      headers: buildHeaders(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(getErrorMessage(data, "فشل في حذف وقت المستوى."));
    }
  } catch {
    const times = getLocalLevelTimes();
    saveLocalLevelTimes(times.filter(t => String(t._id || t.id) !== String(levelTimeId)));
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   دوال مساعدة للعرض
════════════════════════════════════════════════════════════════════════════ */

/* ── ترتيب أيام الأسبوع للفرز ── */
const DAY_ORDER: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

/* ── الحصول على اسم اليوم بالعربي من قيمة اليوم ── */
export function getDayLabel(dayValue: string): string {
  const found = DAY_OPTIONS.find(d => d.value === dayValue);
  return found?.label ?? dayValue;
}

/* ── الحصول على ترتيب اليوم في الأسبوع للفرز ── */
export function getDayOrder(dayValue: string): number {
  return DAY_ORDER[dayValue] ?? 99;
}

/* ── تنسيق الوقت بصيغة 12 ساعة مع ص/م من "HH:MM" ── */
export function formatTime12(timeStr: string): string {
  if (!timeStr) return "—";
  try {
    const [hStr, mStr] = timeStr.split(":");
    let h = parseInt(hStr, 10);
    const m = (mStr ?? "00").padStart(2, "0");
    if (isNaN(h)) return "—";
    const period = h >= 12 ? "م" : "ص";
    h = h % 12 || 12;
    return `${h}:${m} ${period}`;
  } catch {
    return "—";
  }
}

/* ── فرز أوقات المستوى: حسب اليوم ثم الوقت ── */
export function sortLevelTimes(times: LevelTime[]): LevelTime[] {
  return [...times].sort((a, b) => {
    const dayDiff = getDayOrder(a.day) - getDayOrder(b.day);
    if (dayDiff !== 0) return dayDiff;
    return (a.time ?? "").localeCompare(b.time ?? "");
  });
}

/* ── دالة مساعدة للحصول على اسم المستوى بالعربي ── */
export function getLevelLabel(levelValue: string): string {
  const level = LEVEL_OPTIONS.find((l: { value: string; label: string }) => l.value === levelValue);
  return level?.label || levelValue;
}

/* ══ دوال قديمة محتفظ بها للتوافق مع أجزاء أخرى لو وُجدت ══ */

/** @deprecated استخدم getDayLabel بدلاً منها */
export function getDayFromTime(isoTime: string): string {
  return getDayLabel(isoTime);
}

/** @deprecated استخدم formatTime12 بدلاً منها */
export function getFormattedTime12(isoTime: string): string {
  return formatTime12(isoTime);
}

/** @deprecated لا داعي لها بعد إزالة التاريخ */
export function getFormattedDate(_isoTime: string): string {
  return "";
}

/** @deprecated لا داعي لها بعد إزالة التاريخ */
export function datetimeLocalToISO(v: string): string {
  return v;
}

/** @deprecated لا داعي لها بعد إزالة التاريخ */
export function isoToDatetimeLocal(v: string): string {
  return v;
}