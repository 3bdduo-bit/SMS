"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   src/components/ThemeProvider.tsx
   مزوّد الثيم — Context يوفر isDark وtoggle لكل مكوّنات التطبيق

   الجديد:
   - عند الضغط على التبديل تظهر طبقة دائرية تغطي الشاشة (رابل)
   - في منتصف الأنيميشن يُطبَّق تغيير الثيم الفعلي
   - هكذا يختفي الـ "lag" تماماً ويصبح الانتقال سينمائياً
───────────────────────────────────────────────────────────────────────────── */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import ThemeTransitionOverlay from "@/components/ThemeTransitionOverlay";

/* ── نوع Context ── */
interface ThemeContextType {
  isDark: boolean;
  toggle: () => void;
}

/* ── قيمة افتراضية (للـ TypeScript فقط) ── */
const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggle: () => {},
});

/* ════════════════════════════════════════════════════════════════════════════
   ThemeProvider — يُلفّ التطبيق بالكامل في layout.tsx
════════════════════════════════════════════════════════════════════════════ */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  /* ── حالة الأوفرلاي ── */
  const [overlayActive, setOverlayActive] = useState(false);
  const [overlayTowardDark, setOverlayTowardDark] = useState(false);

  /* ── منع التكرار السريع أثناء الأنيميشن ── */
  const isAnimating = useRef(false);

  /* ── تحميل التفضيل المحفوظ عند أول تشغيل ── */
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) {
      const dark = saved === "dark";
      setIsDark(dark);
      document.documentElement.classList.toggle("dark", dark);
    } else {
      /* كشف تفضيل نظام التشغيل */
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(prefersDark);
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  /* ── تبديل الثيم مع أنيميشن الغطاء ── */
  const toggle = useCallback(() => {
    /* تجاهل النقرات أثناء الأنيميشن */
    if (isAnimating.current) return;
    isAnimating.current = true;

    setIsDark(prev => {
      const next = !prev;

      /* 1) تشغيل الأوفرلاي بلون الوجهة */
      setOverlayTowardDark(next);
      setOverlayActive(true);

      return prev; // لا نُغيّر الثيم بعد — ننتظر منتصف الأنيميشن
    });
  }, []);

  /* ── يُستدعى من الأوفرلاي عند منتصف الأنيميشن ── */
  const handleOverlayMidpoint = useCallback(() => {
    /* الآن نُطبّق التغيير الفعلي — الأوفرلاي يخفيه */
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem("theme", next ? "dark" : "light");
      document.documentElement.classList.toggle("dark", next);
      return next;
    });

    /* إخفاء الأوفرلاي بعد اكتمال الأنيميشن (ما تبقى بعد الـ 1000ms الأولى) */
    setTimeout(() => {
      setOverlayActive(false);
      isAnimating.current = false;
    }, 1060); // ما تبقى من الـ 2000ms بعد الـ 1000ms الأولى + هامش بسيط
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}

      {/* ── أوفرلاي الانتقال بين الثيمات ── */}
      <ThemeTransitionOverlay
        towardDark={overlayTowardDark}
        active={overlayActive}
        onDone={handleOverlayMidpoint}
      />
    </ThemeContext.Provider>
  );
}

/* ── هوك مخصص للاستخدام في أي مكوّن ── */
export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}
