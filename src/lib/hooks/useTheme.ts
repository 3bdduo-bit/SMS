/* ─────────────────────────────────────────────────────────────────────────────
   src/lib/hooks/useTheme.ts
   هوك مخصص لإدارة الوضع الليلي / النهاري

   - يحفظ التفضيل في localStorage
   - يُضيف/يُزيل class="dark" على عنصر <html>
   - يكتشف التفضيل الأولي من نظام التشغيل
───────────────────────────────────────────────────────────────────────────── */

"use client";

import { useState, useEffect, useCallback } from "react";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  /* ── تحميل التفضيل المحفوظ عند أول تشغيل ── */
  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    } else {
      // كشف تفضيل النظام تلقائياً
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial: Theme = prefersDark ? "dark" : "light";
      setTheme(initial);
      applyTheme(initial);
    }
  }, []);

  /* ── تطبيق الثيم على عنصر <html> ── */
  function applyTheme(t: Theme) {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }

  /* ── التبديل بين الوضعين ── */
  const toggle = useCallback(() => {
    setTheme(prev => {
      const next: Theme = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", next);
      applyTheme(next);
      return next;
    });
  }, []);

  return { theme, toggle, isDark: theme === "dark" };
}
