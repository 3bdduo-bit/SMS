/* ─────────────────────────────────────────────────────────────────────────────
   src/lib/api/exams.ts
   دوال API الخاصة بالاختبارات

   الـ APIs المدعومة:
     POST   /exam              — إنشاء اختبار جديد (المعلم)
     GET    /exam/:id          — جلب اختبار بمعرّفه
     DELETE /exam/:id          — حذف اختبار (المعلم)
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
  studentId: string;
  studentName: string;
  score: number;
  total: number;
  submittedAt: string;
}

/* ── نوع الاختبار ── */
export interface Exam {
  _id: string;
  title: string;
  level?: string;
  duration: number;           /* بالدقائق */
  startAt: string;            /* ISO date string */
  endAt?: string;             /* تاريخ الانتهاء ISO date string */
  questions: ExamQuestion[];
  results?: ExamResult[];     /* نتائج الطلاب المضافة محلياً */
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

/* ── نظام تخزين وهمي للأسئلة والنتائج (لأن الـ API لا يحفظها) ── */
const EXAM_LOCAL_DB = "sms_exams_db";
function getLocalExamData(id: string) {
  if (typeof window === "undefined") return { questions: [], results: [] };
  try {
    const db = JSON.parse(localStorage.getItem(EXAM_LOCAL_DB) || "{}");
    return db[id] || { questions: [], results: [] };
  } catch { return { questions: [], results: [] }; }
}
export function saveLocalExamData(id: string, data: any) {
  if (typeof window === "undefined") return;
  try {
    const db = JSON.parse(localStorage.getItem(EXAM_LOCAL_DB) || "{}");
    db[id] = { ...db[id], ...data };
    localStorage.setItem(EXAM_LOCAL_DB, JSON.stringify(db));
  } catch {}
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

  const exam = data?.data?.exam ?? data?.data ?? data;
  
  // حفظ الأسئلة والمستوى والعنوان وتاريخ الانتهاء محلياً
  if (exam && exam._id) {
    saveLocalExamData(exam._id, {
      questions: payload.questions,
      results: [],
      level: payload.level || "",
      title: payload.title,
      endAt: payload.endAt || "",
    });
    exam.questions = payload.questions;
    exam.results   = [];
    exam.level     = payload.level || exam.level || "";
    exam.endAt     = payload.endAt || exam.endAt || "";
  }

  return exam;
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

  const exam = data?.data?.exam ?? null;
  if (exam) {
    const localData = getLocalExamData(exam._id);
    // دمج البيانات المحلية مع بيانات الـ API
    exam.questions = localData.questions || [];
    exam.results   = localData.results   || [];
    // بما أن الـ API لا يدعم التعديل، أي تعديلات يقوم بها المعلم تحفظ محلياً فقط وتطغى على بيانات الـ API
    if (localData.level)    exam.level    = localData.level;
    if (localData.title)    exam.title    = localData.title;
    if (localData.endAt)    exam.endAt    = localData.endAt;
    if (localData.startAt)  exam.startAt  = localData.startAt;
    if (localData.duration) exam.duration = localData.duration;
  }

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
   submitExamResult — إرسال نتيجة الطالب محلياً
────────────────────────────────────────────────────────────────────────────── */
export async function submitExamResult(examId: string, result: ExamResult): Promise<void> {
  const localData = getLocalExamData(examId);
  const results = localData.results || [];
  // التحقق مما إذا كان الطالب قد أجرى الاختبار مسبقاً
  const existingIdx = results.findIndex((r: ExamResult) => r.studentId === result.studentId);
  if (existingIdx > -1) {
    results[existingIdx] = result;
  } else {
    results.push(result);
  }
  saveLocalExamData(examId, { results });
}
