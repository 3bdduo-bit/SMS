"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   صفحة البداية  /
   - شاشة تعريفية متجاوبة مع جميع الشاشات (موبايل → سطح مكتب)
   - تظهر مرة واحدة فقط لكل جلسة (sessionStorage)
   - تدعم الوضع الليلي والنهاري
───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "@/components/ThemeProvider";
import { getColors } from "@/lib/theme/colors";
import ThemeToggle from "@/components/ThemeToggle";

const SPLASH_KEY = "arc_splash_seen";

export default function SplashPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);

  const [phase, setPhase] = useState<"check" | "visible" | "fadeOut">("check");

  useEffect(() => {
    const alreadySeen = sessionStorage.getItem(SPLASH_KEY);

    if (alreadySeen) {
      router.replace("/auth/login");
      return;
    }

    sessionStorage.setItem(SPLASH_KEY, "true");
    setPhase("visible");

    const fadeTimer = setTimeout(() => setPhase("fadeOut"), 2400);
    const navTimer  = setTimeout(() => router.replace("/auth/login"), 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(navTimer);
    };
  }, [router]);

  if (phase === "check") return null;

  return (
    <main
      className={`
        min-h-[100dvh] flex flex-col items-center justify-center relative overflow-hidden
        px-4 transition-all duration-700 ease-in-out
        ${phase === "fadeOut" ? "opacity-0" : "opacity-100"}
      `}
      style={{ backgroundColor: C.page }}
    >
      {/* زر تبديل الثيم */}
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-50">
        <ThemeToggle />
      </div>

      <div className="relative flex items-center justify-center">
        <div
          className="absolute rounded-full border-4 w-44 h-44 sm:w-52 sm:h-52 md:w-64 md:h-64 animate-[spinRing_3s_linear_infinite]"
          style={{ borderColor: `${C.borderA}40` }} // 40 hex is ~25% opacity
        />
        <div
          className="absolute rounded-full border-2 w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 animate-[spinRingReverse_4s_linear_infinite]"
          style={{ borderColor: `${C.border}30` }}
        />

        <div
          className="relative rounded-full overflow-hidden shadow-2xl border-4 w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 animate-[logoPulse_2s_ease-in-out_infinite]"
          style={{ borderColor: `${C.borderA}60` }}
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

      <h1
        className="mt-8 sm:mt-10 font-extrabold tracking-widest text-3xl sm:text-4xl md:text-5xl animate-[fadeUp_0.8s_ease-out_0.3s_both]"
        style={{ color: C.hero }}
      >
        ARC
      </h1>

      <p
        className="mt-2 sm:mt-3 tracking-wide text-xs sm:text-sm animate-[fadeUp_0.8s_ease-out_0.6s_both]"
        style={{ color: C.textM }}
      >
        المنصة التعليمية المتكاملة
      </p>

      <div className="mt-10 sm:mt-14 flex flex-col items-center gap-3 sm:gap-4 animate-[fadeUp_0.8s_ease-out_0.9s_both]">
        <div className="relative w-10 h-10 sm:w-12 sm:h-12">
          <div
            className="absolute inset-0 rounded-full border-[3px] animate-spin"
            style={{ borderColor: `${C.borderA}40`, borderTopColor: C.borderA }}
          />
          <div className="absolute inset-1.5 rounded-full overflow-hidden">
            <Image src="/arc-logo.jpg" alt="" fill className="object-cover" />
          </div>
        </div>

        <p className="text-[10px] sm:text-xs tracking-widest animate-pulse" style={{ color: C.textM }}>
          جارٍ التحميل…
        </p>
      </div>

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
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 transparent; }
          50%      { transform: scale(1.04); box-shadow: 0 0 24px 8px rgba(168,200,232,0.18); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}