"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   src/components/ThemeToggle.tsx
   زر التبديل بين الوضع النهاري (شمس) والليلي (قمر)

   - يستخدم useTheme من ThemeProvider (Context)
   - أنيميشن سلس ومثير عند الضغط
   - شمس دوّارة ذهبية ↔ قمر فضي مع نجوم
───────────────────────────────────────────────────────────────────────────── */

import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "التحويل إلى الوضع النهاري" : "التحويل إلى الوضع الليلي"}
      title={isDark ? "الوضع النهاري" : "الوضع الليلي"}
      className="relative w-[60px] h-[30px] rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A8C8E8] shrink-0"
      style={{
        /* خلفية التراك */
        background: isDark
          ? "linear-gradient(135deg, #0D1520 0%, #1A2D45 100%)"
          : "linear-gradient(135deg, #7aafd4 0%, #A8C8E8 100%)",
        boxShadow: isDark
          ? "0 0 10px rgba(139,175,206,0.25), inset 0 1px 3px rgba(0,0,0,0.5)"
          : "0 0 10px rgba(10,41,71,0.15), inset 0 1px 3px rgba(0,0,0,0.1)",
        transition: "background 0.45s ease, box-shadow 0.45s ease",
      }}
    >
      {/* ── نجوم في الوضع الليلي ── */}
      {isDark && (
        <>
          <span className="absolute top-[4px] right-[7px] w-[2.5px] h-[2.5px] rounded-full bg-white/90"
                style={{ animation: "fadeIn 0.5s ease both" }} />
          <span className="absolute top-[10px] right-[13px] w-[1.5px] h-[1.5px] rounded-full bg-white/70"
                style={{ animation: "fadeIn 0.7s ease both" }} />
          <span className="absolute bottom-[5px] right-[8px] w-[2px] h-[2px] rounded-full bg-white/80"
                style={{ animation: "fadeIn 0.6s ease both" }} />
        </>
      )}

      {/* ── سحابة في الوضع النهاري ── */}
      {!isDark && (
        <span
          className="absolute top-[6px] right-[6px] text-white/70 text-[9px] select-none leading-none"
          style={{ animation: "fadeIn 0.4s ease both" }}
        >
          ☁
        </span>
      )}

      {/* ── الكرة المتحركة: شمس أو قمر ── */}
      <span
        className="absolute top-[3px] w-[24px] h-[24px] rounded-full flex items-center justify-center shadow-lg"
        style={{
          /* تنتقل من اليمين (نهار RTL) لليسار (ليل) */
          right: isDark ? "3px" : "calc(100% - 27px)",
          background: isDark
            ? "linear-gradient(135deg, #C5D9ED 0%, #A8C8E8 100%)"
            : "linear-gradient(135deg, #FFD95A 0%, #FFA500 100%)",
          boxShadow: isDark
            ? "0 0 10px rgba(168,200,232,0.55)"
            : "0 0 12px rgba(255,185,0,0.7)",
          transition: "right 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.4s ease, box-shadow 0.4s ease",
        }}
      >
        {/* الإيموجي يدور عند كل تبديل */}
        <span
          className="text-[13px] select-none"
          key={isDark ? "moon" : "sun"}
          style={{ animation: "spinIn 0.4s ease both" }}
        >
          {isDark ? "🌙" : "☀️"}
        </span>
      </span>
    </button>
  );
}
