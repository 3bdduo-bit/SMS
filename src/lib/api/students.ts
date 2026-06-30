/* ─────────────────────────────────────────────────────────────────────────────
   src/lib/api/students.ts
   دوال API الخاصة بالمعلم — إدارة الطلاب

   الـ APIs المدعومة:
     GET  /admin/students             — جلب قائمة جميع الطلاب
     PUT  /admin/students/:id/level   — تحديث مستوى طالب محدد

   كل طلب يرسل JWT token من localStorage في الـ Authorization header
───────────────────────────────────────────────────────────────────────────── */

/** رابط الـ API الأساسي */
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://educationplatform2-production.up.railway.app";

/* ── نوع بيانات الطالب المُرجَعة من الـ API ── */
export interface Student {
  id?: string | number;
  _id?: string;
  userName?: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  level?: string;
  role?: string;
  createdAt?: string;
  ispaid?: string;
  paidUntil?: string;
  [key: string]: unknown; /* حقول إضافية غير معروفة مسبقاً */
}

/* ── نظام تخزين وهمي لحالة الدفع (لأن الـ API لا يحفظها) ── */
const PAYMENT_LOCAL_DB = "sms_payments_db";

function getLocalPayment(id: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const db = JSON.parse(localStorage.getItem(PAYMENT_LOCAL_DB) || "{}");
    return db[id] || null;
  } catch { return null; }
}

export function saveLocalPayment(id: string, ispaid: string) {
  if (typeof window === "undefined") return;
  try {
    const db = JSON.parse(localStorage.getItem(PAYMENT_LOCAL_DB) || "{}");
    db[id] = ispaid;
    localStorage.setItem(PAYMENT_LOCAL_DB, JSON.stringify(db));
  } catch {}
}

/* ── قيم المستويات المتاحة (حتى المستوى الثاني عشر) ── */
export const LEVEL_OPTIONS = [
  { value: "one",     label: "الصف الأول الابتدائي" },
  { value: "two",     label: "الصف الثاني الابتدائي" },
  { value: "three",   label: "الصف الثالث الابتدائي" },
  { value: "four",    label: "الصف الرابع الابتدائي" },
  { value: "five",    label: "الصف الخامس الابتدائي" },
  { value: "six",     label: "الصف السادس الابتدائي" },
  { value: "seven",   label: "الصف الأول الإعدادي" },
  { value: "eight",   label: "الصف الثاني الإعدادي" },
  { value: "nine",    label: "الصف الثالث الإعدادي" },
  { value: "ten",     label: "الصف الأول الثانوي" },
  { value: "eleven",  label: "الصف الثاني الثانوي" },
  { value: "twelve",  label: "الصف الثالث الثانوي" },
] as const;

/* نوع مساعد للمستويات */
export type LevelValue = (typeof LEVEL_OPTIONS)[number]["value"];

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

/* ────────────────────────────────────────────────────────────────────────────
   getStudents — جلب قائمة جميع الطلاب المسجّلين
   GET /admin/students
────────────────────────────────────────────────────────────────────────────── */
export async function getStudents(): Promise<Student[]> {
  const res = await fetch(`${API_URL}/admin/students`, {
    method: "GET",
    headers: buildHeaders(),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data?.message ||
      data?.errorDetails?.[0]?.message ||
      "فشل في جلب قائمة الطلاب.";
    throw new Error(message);
  }

  /* الـ API قد يرجع المصفوفة مباشرة أو داخل data.data أو data.students */
  let students = data?.data?.students ?? data?.data ?? data?.students ?? data;
  if (!Array.isArray(students)) students = [];
  
  return students.map((s: Student) => {
    const localPayment = getLocalPayment(String(s._id || s.id));
    if (localPayment) s.ispaid = localPayment;
    return s;
  });
}

/* ────────────────────────────────────────────────────────────────────────────
   getStudentsByLevel — جلب الطلاب حسب المستوى
   GET /admin/students/level/:level
────────────────────────────────────────────────────────────────────────────── */
export async function getStudentsByLevel(level: string): Promise<Student[]> {
  const res = await fetch(`${API_URL}/admin/students/level/${level}`, {
    method: "GET",
    headers: buildHeaders(),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data?.message ||
      data?.errorDetails?.[0]?.message ||
      "فشل في جلب طلاب هذا المستوى.";
    throw new Error(message);
  }

  let students = data?.data?.students ?? data?.data ?? data?.students ?? data;
  if (!Array.isArray(students)) students = [];

  return students.map((s: Student) => {
    const localPayment = getLocalPayment(String(s._id || s.id));
    if (localPayment) s.ispaid = localPayment;
    return s;
  });
}

/* ────────────────────────────────────────────────────────────────────────────
   updateStudentLevel — تحديث مستوى طالب محدد
   PUT /admin/students/:id
────────────────────────────────────────────────────────────────────────────── */
export async function updateStudentLevel(
  studentId: string | number,
  level: string
): Promise<Student> {
  const res = await fetch(`${API_URL}/admin/students/${studentId}`, {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify({ level }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data?.message ||
      data?.errorDetails?.[0]?.message ||
      "فشل في تحديث مستوى الطالب.";
    throw new Error(message);
  }

  return data?.data?.updatedStudent ?? data?.data?.student ?? data?.data ?? data?.student ?? data;
}

/* ────────────────────────────────────────────────────────────────────────────
   updateStudentPayment — تحديث حالة الدفع للطالب
   PUT /admin/students/paid/:id
────────────────────────────────────────────────────────────────────────────── */
export async function updateStudentPayment(
  studentId: string | number,
  ispaid: string
): Promise<Student> {
  const res = await fetch(`${API_URL}/admin/students/paid/${studentId}`, {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify({ ispaid }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data?.message ||
      data?.errorDetails?.[0]?.message ||
      "فشل في تحديث حالة الدفع.";
    throw new Error(message);
  }

  saveLocalPayment(String(studentId), ispaid);

  const updatedStudent = data?.data?.updatedStudent ?? data?.data ?? data?.student ?? data;
  if (updatedStudent) {
    updatedStudent.ispaid = ispaid;
  }
  return updatedStudent;
}

/* ────────────────────────────────────────────────────────────────────────────
   getStudent — جلب تفاصيل طالب واحد
   GET /admin/students/:id
────────────────────────────────────────────────────────────────────────────── */
export async function getStudent(studentId: string | number): Promise<Student> {
  const res = await fetch(`${API_URL}/admin/students/${studentId}`, {
    method: "GET",
    headers: buildHeaders(),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data?.message ||
      data?.errorDetails?.[0]?.message ||
      "فشل في جلب بيانات الطالب.";
    throw new Error(message);
  }

  const student = data?.data?.student ?? data?.data ?? data?.student ?? data;
  if (student) {
    const localPayment = getLocalPayment(String(student._id || student.id));
    if (localPayment) student.ispaid = localPayment;
  }
  return student;
}

/* ────────────────────────────────────────────────────────────────────────────
   updateStudent — تحديث تفاصيل الطالب
   PUT /admin/students/:id
────────────────────────────────────────────────────────────────────────────── */
export async function updateStudent(
  studentId: string | number,
  payload: Record<string, unknown>
): Promise<Student> {
  const res = await fetch(`${API_URL}/admin/students/${studentId}`, {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data?.message ||
      data?.errorDetails?.[0]?.message ||
      "فشل في تحديث بيانات الطالب.";
    throw new Error(message);
  }

  return data?.data?.student ?? data?.data ?? data?.student ?? data;
}

/* ────────────────────────────────────────────────────────────────────────────
   deleteStudent — حذف الطالب
   DELETE /admin/students/:id
────────────────────────────────────────────────────────────────────────────── */
export async function deleteStudent(studentId: string | number): Promise<void> {
  const res = await fetch(`${API_URL}/admin/students/${studentId}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      data?.message ||
      data?.errorDetails?.[0]?.message ||
      "فشل في حذف الطالب.";
    throw new Error(message);
  }
}
