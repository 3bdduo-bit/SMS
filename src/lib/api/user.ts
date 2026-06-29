/* ─────────────────────────────────────────────────────────────────────────────
   src/lib/api/user.ts
   دوال مشتركة للتعامل مع User APIs

   الـ APIs المدعومة:
     GET    /user/profile  — جلب بيانات المستخدم الحالي
     PUT    /user/profile  — تحديث بيانات المستخدم
     DELETE /user/profile  — حذف حساب المستخدم

   كل طلب يرسل JWT token من localStorage في الـ Authorization header
───────────────────────────────────────────────────────────────────────────── */

/** رابط الـ API الأساسي */
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://educationplatform2-production.up.railway.app";

/* ── نوع بيانات المستخدم المُرجَعة من الـ API ── */
export interface UserProfile {
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
  avatar?: string;
  profileImage?: string;
  createdAt?: string;
  [key: string]: unknown; // حقول إضافية غير معروفة مسبقاً
}

/* ── نوع بيانات تحديث المستخدم ── */
export interface UpdateUserPayload {
  userName?: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  password?: string;
  [key: string]: unknown;
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

/* ────────────────────────────────────────────────────────────────────────────
   getProfile — جلب بيانات المستخدم الحالي
   GET /user/profile
────────────────────────────────────────────────────────────────────────────── */
export async function getProfile(): Promise<UserProfile> {
  const res = await fetch(`${API_URL}/user/profile`, {
    method: "GET",
    headers: buildHeaders(),
  });

  // معالجة استجابة الـ API
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data?.message ||
      data?.errorDetails?.[0]?.message ||
      "فشل في جلب بيانات الملف الشخصي.";
    throw new Error(message);
  }

  // الـ API قد يرجع البيانات مباشرة أو داخل data.data أو data.user
  return data?.data?.user ?? data?.data ?? data?.user ?? data;
}

/* ────────────────────────────────────────────────────────────────────────────
   updateUser — تحديث بيانات المستخدم
   PUT /user/profile
────────────────────────────────────────────────────────────────────────────── */
export async function updateUser(payload: UpdateUserPayload): Promise<UserProfile> {
  const res = await fetch(`${API_URL}/user/profile`, {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data?.message ||
      data?.errorDetails?.[0]?.message ||
      "فشل في تحديث بيانات الملف الشخصي.";
    throw new Error(message);
  }

  return data?.data?.user ?? data?.data ?? data?.user ?? data;
}

/* ────────────────────────────────────────────────────────────────────────────
   deleteUser — حذف حساب المستخدم الحالي
   DELETE /user/profile
────────────────────────────────────────────────────────────────────────────── */
export async function deleteUser(): Promise<void> {
  const res = await fetch(`${API_URL}/user/profile`, {
    method: "DELETE",
    headers: buildHeaders(),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      data?.message ||
      data?.errorDetails?.[0]?.message ||
      "فشل في حذف الحساب.";
    throw new Error(message);
  }
}
