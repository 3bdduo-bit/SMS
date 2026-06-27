/* ─────────────────────────────────────────────────────────────────────────────
   API Route: POST /api/auth/login
   - يعمل كـ proxy من جانب الخادم لتجنب مشكلة CORS
   - يُمرِّر الطلب إلى: https://educationplatform2-production.up.railway.app/auth/login
───────────────────────────────────────────────────────────────────────────── */

import { NextRequest, NextResponse } from "next/server";

/* عنوان الـ API الخارجي */
const EXTERNAL_API = "https://educationplatform2-production.up.railway.app/auth/login";

export async function POST(req: NextRequest) {
  try {
    /* قراءة البيانات الواردة من المتصفح */
    const body = await req.json();

    /* إعادة إرسال الطلب من الخادم إلى Railway — لا CORS هنا */
    const res = await fetch(EXTERNAL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    /* قراءة الرد وإرجاعه للمتصفح */
    const data = await res.json().catch(() => ({}));

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[/api/auth/login] Error:", err);
    return NextResponse.json(
      { message: "حدث خطأ في الخادم، يرجى المحاولة لاحقاً." },
      { status: 500 }
    );
  }
}
