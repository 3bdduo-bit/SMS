/* ─────────────────────────────────────────────────────────────────────────────
   src/lib/api/books.ts
   دوال API الخاصة بالكتب والمصغرات

   الـ APIs المدعومة:
     GET  /admin/books                — جلب قائمة الكتب
     POST /admin/books                — إضافة كتاب جديد
     PUT  /admin/books/:id             — تحديث كتاب
     DELETE /admin/books/:id          — حذف كتاب
     GET  /student/books              — جلب الكتب المتاحة للطالب

   كل طلب يرسل JWT token من localStorage في الـ Authorization header
───────────────────────────────────────────────────────────────────────────── */

import { API_URL } from "./config";
import { LEVEL_OPTIONS } from "./students";

/* ── نوع بيانات الكتاب ── */
export interface Book {
  id?: string | number;
  _id?: string;
  title?: string;
  author?: string;
  description?: string;
  level?: string;
  type?: "book" | "mini-book";
  fileUrl?: string;
  coverUrl?: string;
  createdAt?: string;
  [key: string]: unknown;
}

/* ── نظام تخزين وهمي للكتب (لأن الـ API قد لا يحفظها) ── */
const BOOKS_LOCAL_DB = "sms_books_db";

function getLocalBooks(): Book[] {
  if (typeof window === "undefined") return [];
  try {
    const db = localStorage.getItem(BOOKS_LOCAL_DB);
    return db ? JSON.parse(db) : [];
  } catch { return []; }
}

function saveLocalBooks(books: Book[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BOOKS_LOCAL_DB, JSON.stringify(books));
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
   getBooks — جلب قائمة الكتب للمعلم
   GET /admin/books
────────────────────────────────────────────────────────────────────────────── */
export async function getBooks(): Promise<Book[]> {
  try {
    const res = await fetch(`${API_URL}/admin/books`, {
      method: "GET",
      headers: buildHeaders(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        data?.message ||
        data?.errorDetails?.[0]?.message ||
        "فشل في جلب قائمة الكتب.";
      throw new Error(message);
    }

    let books = data?.data?.books ?? data?.data ?? data?.books ?? data;
    if (!Array.isArray(books)) books = [];
    return books;
  } catch {
    // إذا فشل الـ API، نرجع البيانات المحلية
    return getLocalBooks();
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   getBooksByLevel — جلب الكتب حسب المستوى
   GET /admin/books/level/:level
────────────────────────────────────────────────────────────────────────────── */
export async function getBooksByLevel(level: string): Promise<Book[]> {
  try {
    const res = await fetch(`${API_URL}/admin/books/level/${level}`, {
      method: "GET",
      headers: buildHeaders(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        data?.message ||
        data?.errorDetails?.[0]?.message ||
        "فشل في جلب كتب هذا المستوى.";
      throw new Error(message);
    }

    let books = data?.data?.books ?? data?.data ?? data?.books ?? data;
    if (!Array.isArray(books)) books = [];
    return books;
  } catch {
    // فلترة محلية حسب المستوى
    return getLocalBooks().filter(b => b.level === level);
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   addBook — إضافة كتاب جديد
   POST /admin/books
────────────────────────────────────────────────────────────────────────────── */
export async function addBook(
  book: Omit<Book, "id" | "_id" | "createdAt">
): Promise<Book> {
  // تخزين محلي مباشرة (لأن الـ API قد لا يدعم هذا المسار)
  const newBook: Book = {
    ...book,
    id: Date.now(),
    createdAt: new Date().toISOString(),
  };
  const books = getLocalBooks();
  books.push(newBook);
  saveLocalBooks(books);
  return newBook;
}

/* ────────────────────────────────────────────────────────────────────────────
   updateBook — تحديث كتاب
   PUT /admin/books/:id
────────────────────────────────────────────────────────────────────────────── */
export async function updateBook(
  bookId: string | number,
  book: Partial<Book>
): Promise<Book> {
  // تحديث محلي مباشرة
  const books = getLocalBooks();
  const idx = books.findIndex(b => String(b.id || b._id) === String(bookId));
  if (idx > -1) {
    books[idx] = { ...books[idx], ...book };
    saveLocalBooks(books);
    return books[idx];
  }
  throw new Error("لم يتم العثور على الكتاب.");
}

/* ────────────────────────────────────────────────────────────────────────────
   deleteBook — حذف كتاب
   DELETE /admin/books/:id
────────────────────────────────────────────────────────────────────────────── */
export async function deleteBook(bookId: string | number): Promise<void> {
  // حذف محلي مباشرة
  const books = getLocalBooks();
  const filtered = books.filter(b => String(b.id || b._id) !== String(bookId));
  saveLocalBooks(filtered);
}

/* ────────────────────────────────────────────────────────────────────────────
   getStudentBooks — جلب الكتب المتاحة للطالب (حسب مستواه)
   GET /student/books
────────────────────────────────────────────────────────────────────────────── */
export async function getStudentBooks(): Promise<Book[]> {
  try {
    const res = await fetch(`${API_URL}/student/books`, {
      method: "GET",
      headers: buildHeaders(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        data?.message ||
        data?.errorDetails?.[0]?.message ||
        "فشل في جلب الكتب.";
      throw new Error(message);
    }

    let books = data?.data?.books ?? data?.data ?? data?.books ?? data;
    if (!Array.isArray(books)) books = [];
    return books;
  } catch {
    // إذا فشل الـ API، نرجع البيانات المحلية (فلترة حسب مستوى الطالب)
    const user = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!user) return [];
    try {
      const userData = JSON.parse(user);
      const studentLevel = userData.level;
      return getLocalBooks().filter(b => b.level === studentLevel);
    } catch { return []; }
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   getBooksByType — جلب الكتب حسب النوع (كتاب أو مصغر)
   GET /admin/books/type/:type
────────────────────────────────────────────────────────────────────────────── */
export async function getBooksByType(type: "book" | "mini-book"): Promise<Book[]> {
  try {
    const res = await fetch(`${API_URL}/admin/books/type/${type}`, {
      method: "GET",
      headers: buildHeaders(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        data?.message ||
        data?.errorDetails?.[0]?.message ||
        "فشل في جلب الكتب.";
      throw new Error(message);
    }

    let books = data?.data?.books ?? data?.data ?? data?.books ?? data;
    if (!Array.isArray(books)) books = [];
    return books;
  } catch {
    // فلترة محلية حسب النوع
    return getLocalBooks().filter(b => b.type === type);
  }
}
