"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   src/components/ThemeProvider.tsx
   مزوّد الثيم — Context يوفر isDark وtoggle لكل مكوّنات التطبيق

   لماذا Context وليس CSS Variables فقط؟
   - CSS variables تُحدّث المتصفح مباشرة لكن React لا يعيد الرسم
   - Context يجعل كل مكوّن مشترك يُعيد الرسم فور تغيير الثيم
   - الحل المضمون 100٪ في Next.js / React
───────────────────────────────────────────────────────────────────────────── */

import { createContext, useContext, useState, useEffect, useCallback } from "react";

/* ── نوع Context ── */
interface ThemeContextType {
  isDark: boolean;
  toggle: () => void;
}

/* ── قيمة افتراضية (لا تحدث في التطبيق، فقط للـ TypeScript) ── */
const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggle: () => {},
});

/* ════════════════════════════════════════════════════════════════════════════
   ThemeProvider — يُلفّ التطبيق بالكامل في layout.tsx
════════════════════════════════════════════════════════════════════════════ */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

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

  /* ── تبديل الثيم ── */
  const toggle = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      /* حفظ في localStorage */
      localStorage.setItem("theme", next ? "dark" : "light");
      /* تحديث class على <html> (يخدم CSS variables أيضاً) */
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ── هوك مخصص للاستخدام في أي مكوّن ── */
export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}
