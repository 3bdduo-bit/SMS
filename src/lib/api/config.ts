/* ─────────────────────────────────────────────────────────────────────────────
   src/lib/api/config.ts
   رابط الـ API الأساسي — يُستخدم في جميع ملفات الـ API
───────────────────────────────────────────────────────────────────────────── */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://educationplatform2-production.up.railway.app";
