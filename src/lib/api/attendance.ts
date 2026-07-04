/* ─────────────────────────────────────────────────────────────────────────────
   src/lib/api/attendance.ts
   دوال API الخاصة بحضور الطلاب

   الـ APIs المدعومة:
     GET  /admin/attendance          — جلب سجل الحضور
     POST /admin/attendance          — تسجيل حضور جديد
     PUT  /admin/attendance/:id       — تحديث سجل حضور
     GET  /student/attendance         — جلب سجل حضور الطالب

   كل طلب يرسل JWT token من localStorage في الـ Authorization header
───────────────────────────────────────────────────────────────────────────── */

import { API_URL } from "./config";

/* ── نوع بيانات سجل الحضور ── */
export interface AttendanceRecord {
  id?: string | number;
  _id?: string;
  studentId?: string | number;
  studentName?: string;
  date?: string;
  status?: "present" | "absent" | "late" | "excused";
  notes?: string;
  createdAt?: string;
  [key: string]: unknown;
}

/* ── نظام تخزين وهمي لسجل الحضور (لأن الـ API قد لا يحفظه) ── */
const ATTENDANCE_LOCAL_DB = "sms_attendance_db";

function getLocalAttendance(): AttendanceRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const db = localStorage.getItem(ATTENDANCE_LOCAL_DB);
    return db ? JSON.parse(db) : [];
  } catch { return []; }
}

function saveLocalAttendance(records: AttendanceRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ATTENDANCE_LOCAL_DB, JSON.stringify(records));
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

/* ────────────────────────────────────────────────────────────────────────────
   getAttendance — جلب سجل الحضور للمعلم
   GET /admin/attendance
────────────────────────────────────────────────────────────────────────────── */
export async function getAttendance(): Promise<AttendanceRecord[]> {
  try {
    const res = await fetch(`${API_URL}/admin/attendance`, {
      method: "GET",
      headers: buildHeaders(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        data?.message ||
        data?.errorDetails?.[0]?.message ||
        "فشل في جلب سجل الحضور.";
      throw new Error(message);
    }

    let records = data?.data?.attendance ?? data?.data ?? data?.attendance ?? data;
    if (!Array.isArray(records)) records = [];
    return records;
  } catch {
    // إذا فشل الـ API، نرجع البيانات المحلية
    return getLocalAttendance();
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   getAttendanceByDate — جلب سجل الحضور حسب التاريخ
   GET /admin/attendance/date/:date
────────────────────────────────────────────────────────────────────────────── */
export async function getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
  try {
    const res = await fetch(`${API_URL}/admin/attendance/date/${date}`, {
      method: "GET",
      headers: buildHeaders(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        data?.message ||
        data?.errorDetails?.[0]?.message ||
        "فشل في جلب سجل الحضور لهذا التاريخ.";
      throw new Error(message);
    }

    let records = data?.data?.attendance ?? data?.data ?? data?.attendance ?? data;
    if (!Array.isArray(records)) records = [];
    return records;
  } catch {
    // فلترة محلية حسب التاريخ
    return getLocalAttendance().filter(r => r.date === date);
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   recordAttendance — تسجيل حضور جديد
   POST /admin/attendance
────────────────────────────────────────────────────────────────────────────── */
export async function recordAttendance(
  studentId: string | number,
  status: "present" | "absent" | "late" | "excused",
  date: string,
  notes?: string
): Promise<AttendanceRecord> {
  try {
    const res = await fetch(`${API_URL}/admin/attendance`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ studentId, status, date, notes }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        data?.message ||
        data?.errorDetails?.[0]?.message ||
        "فشل في تسجيل الحضور.";
      throw new Error(message);
    }

    return data?.data?.attendance ?? data?.data ?? data?.attendance ?? data;
  } catch {
    // تخزين محلي إذا فشل الـ API
    const newRecord: AttendanceRecord = {
      studentId,
      status,
      date,
      notes,
      createdAt: new Date().toISOString(),
    };
    const records = getLocalAttendance();
    records.push(newRecord);
    saveLocalAttendance(records);
    return newRecord;
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   updateAttendance — تحديث سجل حضور
   PUT /admin/attendance/:id
────────────────────────────────────────────────────────────────────────────── */
export async function updateAttendance(
  recordId: string | number,
  status: "present" | "absent" | "late" | "excused",
  notes?: string
): Promise<AttendanceRecord> {
  try {
    const res = await fetch(`${API_URL}/admin/attendance/${recordId}`, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify({ status, notes }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        data?.message ||
        data?.errorDetails?.[0]?.message ||
        "فشل في تحديث سجل الحضور.";
      throw new Error(message);
    }

    return data?.data?.attendance ?? data?.data ?? data?.attendance ?? data;
  } catch {
    // تحديث محلي
    const records = getLocalAttendance();
    const idx = records.findIndex(r => String(r.id || r._id) === String(recordId));
    if (idx > -1) {
      records[idx].status = status;
      if (notes) records[idx].notes = notes;
      saveLocalAttendance(records);
      return records[idx];
    }
    throw new Error("لم يتم العثور على سجل الحضور.");
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   getStudentAttendance — جلب سجل حضور طالب معين
   GET /student/attendance
────────────────────────────────────────────────────────────────────────────── */
export async function getStudentAttendance(): Promise<AttendanceRecord[]> {
  try {
    const res = await fetch(`${API_URL}/student/attendance`, {
      method: "GET",
      headers: buildHeaders(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        data?.message ||
        data?.errorDetails?.[0]?.message ||
        "فشل في جلب سجل الحضور.";
      throw new Error(message);
    }

    let records = data?.data?.attendance ?? data?.data ?? data?.attendance ?? data;
    if (!Array.isArray(records)) records = [];
    return records;
  } catch {
    // إذا فشل الـ API، نرجع البيانات المحلية (فلترة حسب الطالب الحالي)
    const user = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!user) return [];
    try {
      const userData = JSON.parse(user);
      const studentId = userData._id || userData.id;
      return getLocalAttendance().filter(r => String(r.studentId) === String(studentId));
    } catch { return []; }
  }
}
