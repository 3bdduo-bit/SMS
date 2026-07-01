/* ─────────────────────────────────────────────────────────────────────────────
   src/lib/api/exams.ts
   دوال API الخاصة بالاختبارات

   الـ APIs المدعومة:
     POST   /exam                  — إنشاء اختبار جديد
     PUT    /exam/questions/:id    — إضافة / تحديث أسئلة الاختبار
     GET    /exam/teacher          — جلب اختبارات المعلم
     GET    /exam/:id              — جلب اختبار بمعرّفه
     DELETE /exam/:id              — حذف اختبار
     POST   /exam/solve/:id        — تسليم إجابات الطالب
     PUT    /exam/active/:id       — تفعيل / إيقاف الاختبار
     GET    /exam/result/:id       — جلب جميع نتائج الاختبار
───────────────────────────────────────────────────────────────────────────── */

import { API_URL } from "./config";

/* ── نوع السؤال الواحد ── */
export interface ExamQuestion {
  _id?: string;
  question: string;
  type?: "mcq" | "tf";
  choices: string[];
  answer: string;
  correctAnswer?: string;
}

/* ── إجابة الطالب عند التسليم ── */
export interface SolveAnswer {
  questionId: string;
  selectedAnswer: string;
}

/* ── نتيجة الطالب في الاختبار ── */
export interface ExamResult {
  _id?: string;
  studentId: string | { _id: string; fullName?: string; userName?: string; name?: string };
  studentName?: string;
  score: number;
  total: number;
  submittedAt?: string;
}

/* ── نوع الاختبار الكامل ── */
export interface Exam {
  _id: string;
  title: string;
  level?: string;
  duration: number;
  startAt: string;
  endAt?: string;
  isActive?: boolean | string;
  questions: ExamQuestion[];
  results?: ExamResult[];
  teacherId?: { _id: string; fullName?: string } | string;
  __v?: number;
}

/* ── payload إنشاء اختبار ── */
export interface CreateExamPayload {
  title: string;
  level?: string;
  startAt: string;
  endAt?: string;
  duration: number;
}

/* ── payload السؤال المفرد كما يتوقعه الـ API ── */
interface SingleQuestionPayload {
  question: string;
  choices: string[];
  correctAnswer: string;
}

/* ── payload إضافة أسئلة من جهة الواجهة ── */
export interface AddQuestionsPayload {
  questions: ExamQuestion[];
}

/* ── استخراج الـ token من localStorage ── */
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

/* ── استخراج رسالة الخطأ من استجابة الـ API ── */
function getErrorMessage(data: Record<string, unknown>, fallback: string): string {
  const details = data?.errorDetails as { message?: string }[] | undefined;
  return (
    (data?.message as string) ||
    details?.[0]?.message ||
    fallback
  );
}

/* ── تطبيع حالة التفعيل (قد تأتي كنص "true"/"false") ── */
export function isExamActive(exam: Exam): boolean {
  const v = exam.isActive;
  if (typeof v === "string") return v.toLowerCase() === "true";
  return Boolean(v);
}

/* ── تطبيع نتيجة طالب واحدة من أي شكل يرجعه الـ API ── */
function normalizeResult(raw: Record<string, unknown>): ExamResult {
  const studentId = raw.studentId as ExamResult["studentId"];
  const studentObj = typeof studentId === "object" && studentId ? studentId : null;

  return {
    _id: raw._id as string | undefined,
    studentId: studentId ?? "",
    studentName:
      (raw.studentName as string) ||
      studentObj?.fullName ||
      studentObj?.userName ||
      studentObj?.name,
    score: Number(raw.score ?? raw.correctAnswers ?? raw.mark ?? 0),
    total: Number(raw.total ?? raw.totalQuestions ?? raw.maxScore ?? raw.outOf ?? 0),
    submittedAt: (raw.submittedAt ?? raw.createdAt ?? raw.submitted_at) as string | undefined,
  };
}

/* ── استخراج الاختبار من استجابة الـ API ── */
function extractExam(data: Record<string, unknown>): Exam {
  const exam = (data?.data as Record<string, unknown>)?.exam
    ?? data?.data
    ?? data?.exam
    ?? data;

  const e = exam as Exam;
  if (!Array.isArray(e.questions)) {
    e.questions = [];
    return e;
  }

  /* توحيد اسم الإجابة الصحيحة لأن الـ backend يستخدم correctAnswer */
  e.questions = e.questions.map((q) => {
    const raw = q as ExamQuestion & { correctAnswer?: string };
    return {
      ...raw,
      answer: raw.answer ?? raw.correctAnswer ?? "",
      correctAnswer: raw.correctAnswer ?? raw.answer ?? "",
    };
  });
  return e;
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
  if (!res.ok) throw new Error(getErrorMessage(data, "فشل في إنشاء الاختبار."));
  return extractExam(data);
}

/* ── تحويل سؤال الواجهة إلى الشكل الذي يتوقعه الـ backend ── */
function toSingleQuestionPayload(question: ExamQuestion): SingleQuestionPayload {
  return {
    question: question.question.trim(),
    choices: question.choices.map(choice => choice.trim()),
    correctAnswer: (question.correctAnswer ?? question.answer).trim(),
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   addQuestionsToExam — إضافة أسئلة للاختبار
   PUT /exam/questions/:examId
   ملاحظة: الـ API يقبل سؤالاً واحداً في كل طلب، لذلك نرسلها بالتتابع
────────────────────────────────────────────────────────────────────────────── */
export async function addQuestionsToExam(
  examId: string,
  payload: AddQuestionsPayload
): Promise<Exam> {
  let lastResponse: Record<string, unknown> | null = null;

  for (const question of payload.questions) {
    const res = await fetch(`${API_URL}/exam/questions/${examId}`, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify(toSingleQuestionPayload(question)),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(getErrorMessage(data, "فشل في إضافة الأسئلة للاختبار."));
    lastResponse = data as Record<string, unknown>;
  }

  /* بعد إضافة جميع الأسئلة، نجلب الاختبار الكامل لضمان مزامنة الواجهة */
  if (payload.questions.length === 0) {
    const exam = await getExam(examId);
    if (!exam) throw new Error("تمت العملية لكن تعذر جلب الاختبار.");
    return exam;
  }

  const fetchedExam = await getExam(examId);
  if (fetchedExam) return fetchedExam;

  if (!lastResponse) throw new Error("تمت العملية لكن تعذر قراءة الاستجابة.");
  return extractExam(lastResponse);
}

/* ────────────────────────────────────────────────────────────────────────────
   createExamWithQuestions — إنشاء اختبار ثم إضافة الأسئلة
────────────────────────────────────────────────────────────────────────────── */
export async function createExamWithQuestions(
  examInfo: CreateExamPayload,
  questions: ExamQuestion[]
): Promise<Exam> {
  const createdExam = await createExam(examInfo);
  if (!createdExam?._id) throw new Error("لم يُعَد معرّف الاختبار من الـ API.");

  if (questions.length > 0) {
    const withQuestions = await addQuestionsToExam(createdExam._id, { questions });
    return withQuestions ?? { ...createdExam, questions };
  }

  return { ...createdExam, questions: [] };
}

/* ────────────────────────────────────────────────────────────────────────────
   getTeacherExams — جلب جميع اختبارات المعلم
   GET /exam/teacher
────────────────────────────────────────────────────────────────────────────── */
export async function getTeacherExams(): Promise<Exam[]> {
  const res = await fetch(`${API_URL}/exam/teacher`, {
    method: "GET",
    headers: buildHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getErrorMessage(data, "فشل في جلب الاختبارات."));

  const exams = (data?.data as Record<string, unknown>)?.exams
    ?? data?.data
    ?? data?.exams
    ?? data;

  const list = Array.isArray(exams) ? exams : [];
  return list.map(e => {
    const exam = e as Exam;
    if (!Array.isArray(exam.questions)) exam.questions = [];
    return exam;
  });
}

/* ────────────────────────────────────────────────────────────────────────────
   getExam — جلب اختبار واحد
   GET /exam/:id
────────────────────────────────────────────────────────────────────────────── */
export async function getExam(examId: string): Promise<Exam | null> {
  const res = await fetch(`${API_URL}/exam/${examId}`, {
    method: "GET",
    headers: buildHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getErrorMessage(data, "فشل في جلب الاختبار."));
  return extractExam(data);
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
    throw new Error(getErrorMessage(data, "فشل في حذف الاختبار."));
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   solveExamAPI — تسليم إجابات الطالب
   POST /exam/solve/:id
   الـ payload: { answers: [{ questionId, selectedAnswer }] }
────────────────────────────────────────────────────────────────────────────── */
export async function solveExamAPI(
  examId: string,
  payload: { answers: SolveAnswer[] }
): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_URL}/exam/solve/${examId}`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getErrorMessage(data, "فشل في تسليم الاختبار."));
  return (data?.data as Record<string, unknown>) ?? data;
}

/* ── بناء إجابات التسليم من اختيارات الطالب ── */
export function buildSolvePayload(
  questions: ExamQuestion[],
  selected: Record<number, string>
): SolveAnswer[] {
  return questions
    .map((q, i) => {
      const choice = selected[i];
      if (!choice || !q._id) return null;

      /* الـ API يتوقع selectedAnswer كرقم الخيار (مثل "0", "1", "2") */
      const idx = q.choices.findIndex(c => c === choice);
      const selectedAnswer = idx >= 0 ? String(idx) : choice;

      return { questionId: q._id, selectedAnswer };
    })
    .filter((a): a is SolveAnswer => a !== null);
}

/* ────────────────────────────────────────────────────────────────────────────
   activeExam — تفعيل / إيقاف الاختبار
   PUT /exam/active/:id
   الـ API يتوقع isActive كنص: "true" أو "false"
────────────────────────────────────────────────────────────────────────────── */
export async function activeExam(examId: string, isActive: boolean): Promise<void> {
  const res = await fetch(`${API_URL}/exam/active/${examId}`, {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify({ isActive: isActive ? "true" : "false" }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getErrorMessage(data, "فشل في تغيير حالة الاختبار."));
}

/* ────────────────────────────────────────────────────────────────────────────
   getExamResults — جلب جميع نتائج الاختبار
   GET /exam/result/:id
────────────────────────────────────────────────────────────────────────────── */
export async function getExamResults(examId: string): Promise<ExamResult[]> {
  const res = await fetch(`${API_URL}/exam/result/${examId}`, {
    method: "GET",
    headers: buildHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getErrorMessage(data, "فشل في جلب نتائج الاختبار."));

  const raw =
    (data?.data as Record<string, unknown>)?.results
    ?? (data?.data as Record<string, unknown>)?.exam
    ?? data?.results
    ?? data?.data
    ?? data;

  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Record<string, unknown>)?.results)
      ? (raw as Record<string, unknown>).results as Record<string, unknown>[]
      : [];

  return list.map(r => normalizeResult(r as Record<string, unknown>));
}

/* ── استخراج الدرجة من استجابة التسليم ── */
export function extractScoreFromSolveResponse(
  response: Record<string, unknown>,
  fallbackTotal: number
): { score: number; total: number } {
  const inner = (response?.result ?? response?.examResult ?? response) as Record<string, unknown>;
  return {
    score: Number(inner?.score ?? response?.score ?? inner?.correctAnswers ?? 0),
    total: Number(inner?.total ?? response?.total ?? inner?.totalQuestions ?? fallbackTotal),
  };
}
