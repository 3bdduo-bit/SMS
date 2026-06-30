"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   src/components/ThemeTransitionOverlay.tsx
   طبقة تغطية الصفحة عند تبديل الثيم

   - دائرة تتمدد من المركز وتغطي كل الشاشة
   - تُخفي لحظة التغيير الفعلي حتى لا يشعر المستخدم بـ "lag"
   - تتلاشى بعد تطبيق الثيم الجديد
───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";

interface Props {
  /** هل الانتقال نحو الوضع الليلي؟ */
  towardDark: boolean;
  /** هل الأوفرلاي نشط الآن؟ */
  active: boolean;
  /** كول باك يُستدعى عند منتصف الأنيميشن (لحظة تطبيق الثيم) */
  onDone: () => void;
}

export default function ThemeTransitionOverlay({ towardDark, active, onDone }: Props) {
  const circleRef = useRef<HTMLDivElement>(null);
  /* مرحلة الأنيميشن: expand → hold → fadeOut */
  const [phase, setPhase] = useState<"expand" | "fadeOut" | "hidden">("hidden");

  useEffect(() => {
    if (!active) {
      /* إشارة إخفاء من الـ Provider — ابدأ التلاشي */
      setPhase("fadeOut");
      const t = setTimeout(() => setPhase("hidden"), 400);
      return () => clearTimeout(t);
    }

    /* بدء مرحلة التمدد */
    setPhase("expand");

    /* عند المنتصف (500ms) → أبلغ Provider لتطبيق الثيم */
    const midpoint = setTimeout(() => {
      onDone();
    }, 500);

    return () => clearTimeout(midpoint);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (phase === "hidden") return null;

  /* لون الدائرة حسب الوجهة */
  const bg = towardDark
    ? "radial-gradient(circle, #0D1520 0%, #0A2947 100%)"
    : "radial-gradient(circle, #FFFAF3 0%, #FFF2DB 100%)";

  return (
    /* طبقة ثابتة تغطي كامل الشاشة — pointer-events-none لا تعيق التفاعل */
    <div
      className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
      aria-hidden="true"
      style={{
        /* تلاشي تدريجي في مرحلة الخروج */
        opacity: phase === "fadeOut" ? 0 : 1,
        transition: phase === "fadeOut" ? "opacity 400ms ease" : "none",
      }}
    >
      {/* الدائرة المتمددة */}
      <div
        ref={circleRef}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          /* حجم يكفي لتغطية أكبر شاشة */
          width: "100vmax",
          height: "100vmax",
          borderRadius: "50%",
          translate: "-50% -50%",
          background: bg,
          /* أنيميشن التمدد عبر CSS */
          animation:
            phase === "expand"
              ? "themeRippleExpand 1000ms cubic-bezier(0.4, 0, 0.2, 1) forwards"
              : "none",
        }}
      />

      {/* ── keyframes مضمّنة في style tag ── */}
      <style>{`
        @keyframes themeRippleExpand {
          from { transform: scale(0); }
          to   { transform: scale(4); }
        }
      `}</style>
    </div>
  );
}
