"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Printer, Copy, X } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { getColors } from "@/lib/theme/colors";

/* ─────────────────────────────────────────────────────────────────────────────
   حارس الأمان — SecurityGuard

   1. يمنع قائمة الكليك الأيمن الافتراضية
   2. يعرض قائمة مخصصة فيها فقط: طباعة + نسخ
   3. يمنع فتح أدوات المطوّر (Inspect / DevTools / Lighthouse)
   4. يمنع Ctrl+U (View Source)
───────────────────────────────────────────────────────────────────────────── */

export default function SecurityGuard() {
  const { isDark } = useTheme();
  const C = getColors(isDark);

  /* ── حالة القائمة المخصصة ── */
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /* ── منع الكليك الأيمن الافتراضي وإظهار القائمة المخصصة ── */
  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    /* حساب الموقع مع مراعاة حدود الشاشة */
    const menuWidth = 200;
    const menuHeight = 120;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 10);

    setMenu({ x, y });
  }, []);

  /* ── إغلاق القائمة عند الضغط في أي مكان آخر ── */
  const handleClick = useCallback(() => {
    setMenu(null);
  }, []);

  /* ── منع اختصارات أدوات المطوّر ── */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    /* F12 → DevTools */
    if (e.key === "F12") {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    /* Ctrl+Shift+I → Inspect */
    if (e.ctrlKey && e.shiftKey && e.key === "I") {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    /* Ctrl+Shift+J → Console */
    if (e.ctrlKey && e.shiftKey && e.key === "J") {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    /* Ctrl+Shift+C → Element picker */
    if (e.ctrlKey && e.shiftKey && e.key === "C") {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    /* Ctrl+U → View Source */
    if (e.ctrlKey && e.key === "u") {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    /* Ctrl+S → Save page */
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  }, []);

  /* ── تفعيل المستمعات ── */
  useEffect(() => {
    document.addEventListener("contextmenu", handleContextMenu, true);
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [handleContextMenu, handleClick, handleKeyDown]);

  /* ── أمر الطباعة ── */
  const handlePrint = useCallback(() => {
    setMenu(null);
    window.print();
  }, []);

  /* ── أمر النسخ ── */
  const handleCopy = useCallback(() => {
    setMenu(null);
    const selection = window.getSelection();
    const selectedText = selection?.toString() || "";

    if (selectedText) {
      /* نسخ النص المحدد */
      navigator.clipboard.writeText(selectedText).catch(() => {});
    } else {
      /* إذا لم يكن هناك نص محدد، انسخ عنوان الصفحة */
      navigator.clipboard.writeText(document.title).catch(() => {});
    }
  }, []);

  /* ── لا تعرض شيء إذا القائمة مغلقة ── */
  if (!menu) return null;

  return (
    /* ── خلفية شفافة لإغلاق القائمة عند الضغط خارجها ── */
    <div className="fixed inset-0 z-[99999]" onClick={handleClick}>
      {/* ── القائمة المخصصة ── */}
      <div
        ref={menuRef}
        className="fixed rounded-xl shadow-2xl border overflow-hidden animate-[scaleIn_0.15s_ease-out_forwards]"
        style={{
          top: menu.y,
          left: menu.x,
          minWidth: 180,
          backgroundColor: C.card,
          borderColor: C.border,
          transformOrigin: "top right",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── زر الطباعة ── */}
        <button
          onClick={handlePrint}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium cursor-pointer transition-colors duration-200 hover:bg-[#A8C8E8]/15"
          style={{ color: C.textP }}
        >
          <Printer className="w-4 h-4 text-[#A8C8E8]" />
          <span>طباعة الصفحة</span>
          <span className="mr-auto text-[10px] opacity-40 font-mono" style={{ direction: "ltr" }}>Ctrl+P</span>
        </button>

        {/* ── فاصل ── */}
        <div className="h-px mx-3" style={{ backgroundColor: C.border }} />

        {/* ── زر النسخ ── */}
        <button
          onClick={handleCopy}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium cursor-pointer transition-colors duration-200 hover:bg-[#A8C8E8]/15"
          style={{ color: C.textP }}
        >
          <Copy className="w-4 h-4 text-[#A8C8E8]" />
          <span>نسخ</span>
          <span className="mr-auto text-[10px] opacity-40 font-mono" style={{ direction: "ltr" }}>Ctrl+C</span>
        </button>
      </div>
    </div>
  );
}
