"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   صفحة البداية  /
   - شاشة تعريفية متجاوبة مع جميع الشاشات (موبايل → سطح مكتب)
   - تظهر مرة واحدة فقط لكل جلسة (sessionStorage)
   - الألوان: #0A2947 / #FFE5BF / #FFF2DB / #FFFAF3
───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

/* مفتاح التخزين في sessionStorage */
const SPLASH_KEY = "arc_splash_seen";

export default function SplashPage() {
  const router = useRouter();

  /* ── مراحل الانيميشن ──
       "check"   → التحقق من sessionStorage
       "visible" → الشاشة ظاهرة بالكامل
       "fadeOut" → بدء التلاشي قبل الانتقال
  ── */
  const [phase, setPhase] = useState<"check" | "visible" | "fadeOut">("check");

  useEffect(() => {
    const alreadySeen = sessionStorage.getItem(SPLASH_KEY);

    /* إذا رأى الشاشة من قبل → انتقل فوراً */
    if (alreadySeen) {
      router.replace("/auth/login");
      return;
    }

    /* أول زيارة → خزّن العلامة وابدأ الانيميشن */
    sessionStorage.setItem(SPLASH_KEY, "true");
    setPhase("visible");

    const fadeTimer = setTimeout(() => setPhase("fadeOut"), 2400);
    const navTimer  = setTimeout(() => router.replace("/auth/login"), 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(navTimer);
    };
  }, [router]);

  /* لا نعرض شيئاً أثناء فحص sessionStorage */
  if (phase === "check") return null;

  return (
    /*
     * حاوية الشاشة الكاملة
     * safe-area → يحترم الـ notch والـ home bar في iOS
     */
    <main
      className={`
        min-h-[100dvh] flex flex-col items-center justify-center
        bg-[#0A2947] px-4
        transition-opacity duration-700 ease-in-out
        ${phase === "fadeOut" ? "opacity-0" : "opacity-100"}
      `}
    >

      {/* ── حلقات الانيميشن الدوارة حول الشعار ── */}
      <div className="relative flex items-center justify-center">

        {/* الحلقة الخارجية — تتكيف مع حجم الشاشة */}
        <div
          className="
            absolute rounded-full border-4 border-[#FFE5BF]/30
            w-44 h-44 sm:w-52 sm:h-52 md:w-64 md:h-64
            animate-[spinRing_3s_linear_infinite]
          "
        />

        {/* الحلقة الداخلية المعاكسة */}
        <div
          className="
            absolute rounded-full border-2 border-[#FFF2DB]/20
            w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52
            animate-[spinRingReverse_4s_linear_infinite]
          "
        />

        {/* ── الشعار المركزي ── */}
        <div
          className="
            relative rounded-full overflow-hidden shadow-2xl
            border-4 border-[#FFE5BF]/40
            w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44
            animate-[logoPulse_2s_ease-in-out_infinite]
          "
        >
          <Image
            src="/arc-logo.jpg"
            alt="شعار ARC"
            fill
            priority
            sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, 176px"
            className="object-cover"
          />
        </div>
      </div>

      {/* ── اسم المنصة — حجم الخط متجاوب ── */}
      <h1
        className="
          mt-8 sm:mt-10 font-extrabold tracking-widest text-[#FFE5BF]
          text-3xl sm:text-4xl md:text-5xl
          animate-[fadeUp_0.8s_ease-out_0.3s_both]
        "
      >
        ARC
      </h1>

      {/* ── وصف قصير ── */}
      <p
        className="
          mt-2 sm:mt-3 tracking-wide text-[#FFF2DB]/70
          text-xs sm:text-sm
          animate-[fadeUp_0.8s_ease-out_0.6s_both]
        "
      >
        المنصة التعليمية المتكاملة
      </p>

      {/* ── مؤشر التحميل بشعار ARC ── */}
      <div
        className="
          mt-10 sm:mt-14 flex flex-col items-center gap-3 sm:gap-4
          animate-[fadeUp_0.8s_ease-out_0.9s_both]
        "
      >
        {/* حلقة دوارة بداخلها الشعار */}
        <div className="relative w-10 h-10 sm:w-12 sm:h-12">
          <div
            className="absolute inset-0 rounded-full border-[3px]
                       border-[#FFE5BF]/20 border-t-[#FFE5BF] animate-spin"
          />
          <div className="absolute inset-1.5 rounded-full overflow-hidden">
            <Image src="/arc-logo.jpg" alt="" fill className="object-cover" />
          </div>
        </div>

        <p className="text-[10px] sm:text-xs text-[#FFF2DB]/50 tracking-widest animate-pulse">
          جارٍ التحميل…
        </p>
      </div>

      {/* ── كيفريمات الانيميشن ── */}
      <style>{`
        @keyframes spinRing {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes spinRingReverse {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes logoPulse {
          0%, 100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(255,229,191,0); }
          50%       { transform: scale(1.04); box-shadow: 0 0 24px 8px rgba(255,229,191,0.15); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}