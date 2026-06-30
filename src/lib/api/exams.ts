/* ─────────────────────────────────────────────────────────────────────────────
   src/lib/api/exams.ts
   دوال API الخاصة بالاختبارات — بدون أي localStorage

   الـ APIs المدعومة:
     POST   /exam              — إنشاء اختبار جديد (المعلم)
     GET    /exam/teacher      — جلب اختبارات المعلم
     GET    /exam/:id          — جلب اختبار بمعرّفه
     DELETE /exam/:id          — حذف اختبار (المعلم)
     POST   /exam/solve/:id    — تسليم إجابات الطالب
     PUT    /exam/active/:id   — تفعيل / إيقاف الاختبار (المعلم)
     GET    /exam/result/:id   — جلب جميع نتائج الاختبار (المعلم)
───────────────────────────────────────────────────────────────────────────── */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://educationplatform2-production.up.railway.app";

/* ── نوع السؤال الواحد ── */
export interface ExamQuestion {
  question: string;
  type?: "mcq" | "tf"; // "mcq" = متعدد الخيارات, "tf" = صح/خطأ
  choices: string[];
  answer: string;
}

/* ── نتيجة الطالب في الاختبار ── */
export interface ExamResult {
  _id?: string;
  studentId: string | { _id: string; fullName?: string; userName?: string };
  studentName?: string;
  score: number;
  total: number;
  submittedAt?: string;
}

/* ── نوع الاختبار ── */
export interface Exam {
  _id: string;
  title: string;
  level?: string;
  duration: number;           /* بالدقائق */
  startAt: string;            /* ISO date string */
  endAt?: string;             /* تاريخ الانتهاء ISO date string */
  isActive?: boolean;         /* حالة التفعيل */
  questions: ExamQuestion[];
  results?: ExamResult[];
  teacherId?: { _id: string; fullName?: string } | string;
  __v?: number;
}

/* ── payload إنشاء اختبار جديد ── */
export interface CreateExamPayload {
  title: string;
  level?: string;
  startAt: string;
  endAt?: string;
  duration: number;
  questions: ExamQuestion[];
}

/* ── استخراج الـ token من localStorage بأمان (للمصادقة فقط) ── */
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
   createExam — إنشاء اختبار جديد
   POST /exam
────────────────────────────────────────────────────────────────────────────── */
export async function createExam(payload: CreateExamPayload): Promise<Exam> {
  const res = await fetch(`${API_URL}/exam`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data?.message ||
      data?.errorDetails?.[0]?.message ||
      "فشل في إنشاء الاختبار.";
    throw new Error(message);
  }

  /* استخراج الاختبار من الاستجابة */
  const exam = data?.data?.exam ?? data?.data ?? data;

  /* نضيف الأسئلة من الـ payload لأن الـ API قد لا يُعيدها */
  if (exam && exam._id) {
    exam.questions = payload.questions;
    exam.level     = payload.level || exam.level || "";
    exam.endAt     = payload.endAt || exam.endAt || "";
  }

  return exam;
}

/* ────────────────────────────────────────────────────────────────────────────
   getTeacherExams — جلب جميع اختبارات المعلم الحالي
   GET /exam/teacher
────────────────────────────────────────────────────────────────────────────── */
export async function getTeacherExams(): Promise<Exam[]> {
  const res = await fetch(`${API_URL}/exam/teacher`, {
    method: "GET",
    headers: buildHeaders(),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data?.message ||
      data?.errorDetails?.[0]?.message ||
      "فشل في جلب الاختبارات.";
    throw new Error(message);
  }

  /* الـ API قد يرجع المصفوفة مباشرة أو داخل data */
  const exams: Exam[] = data?.data?.exams ?? data?.data ?? data?.exams ?? data ?? [];
  return Array.isArray(exams) ? exams : [];
}

/* ────────────────────────────────────────────────────────────────────────────
   getExam — جلب اختبار واحد بمعرّفه
   GET /exam/:id
────────────────────────────────────────────────────────────────────────────── */
export async function getExam(examId: string): Promise<Exam | null> {
  const res = await fetch(`${API_URL}/exam/${examId}`, {
    method: "GET",
    headers: buildHeaders(),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data?.message ||
      data?.errorDetails?.[0]?.message ||
      "فشل في جلب الاختبار.";
    throw new Error(message);
  }

  /* استخراج الاختبار من الاستجابة */
  const exam = data?.data?.exam ?? data?.data ?? data?.exam ?? null;
  return exam;
}

/* ────────────────────────────────────────────────────────────────────────────
   deleteExam — حذف اختبار
   DELETE /exam/:id
────────────────────────────────────────────────────────────────────────────── */
export async function deleteExam(examId: string): Promise<void> {
  const res = await fetch(`${API_URL}/exam/${examId}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      data?.message ||
      data?.errorDetails?.[0]?.message ||
      "فشل في حذف الاختبار.";
    throw new Error(message);
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   solveExamAPI — تسليم إجابات الطالب
   POST /exam/solve/:id
   الـ payload: { answers: ["إجابة1", "إجابة2", ...] }
────────────────────────────────────────────────────────────────────────────── */
export async function solveExamAPI(
  examId: string,
  payload: { answers: string[] }
): Promise<any> {
  const res = await fetch(`${API_URL}/exam/solve/${examId}`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data?.message ||
      data?.errorDetails?.[0]?.message ||
      "فشل في تسليم الاختبار.";
    throw new Error(message);
  }
  return data;
}

/* ────────────────────────────────────────────────────────────────────────────
   activeExam — تفعيل / إيقاف الاختبار (زر تبديل)
   PUT /exam/active/:id
────────────────────────────────────────────────────────────────────────────── */
export async function activeExam(examId: string): Promise<void> {
  const res = await fetch(`${API_URL}/exam/active/${examId}`, {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify({ isActive: true }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data?.message ||
      data?.errorDetails?.[0]?.message ||
      "فشل في تغيير حالة الاختبار.";
    throw new Error(message);
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   getExamResults — جلب جميع نتائج الاختبار (للمعلم)
   GET /exam/result/:id
────────────────────────────────────────────────────────────────────────────── */
export async function getExamResults(examId: string): Promise<ExamResult[]> {
  const res = await fetch(`${API_URL}/exam/result/${examId}`, {
    method: "GET",
    headers: buildHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data?.message ||
      data?.errorDetails?.[0]?.message ||
      "فشل في جلب نتائج الاختبار.";
    throw new Error(message);
  }

  /* نُرجع المصفوفة من أيّ مكان وجدت في الاستجابة */
  const results = data?.data?.results ?? data?.data ?? data?.results ?? data;
  return Array.isArray(results) ? results : [];
}
