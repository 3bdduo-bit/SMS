"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   AppLoaderWrapper — يُغلّف كامل التطبيق
   - يتحقق من sessionStorage → إذا لم يُشاهَد الـ loader من قبل يُظهره
   - بعد اكتمال التحميل يُخفيه ويُظهر المحتوى الحقيقي
───────────────────────────────────────────────────────────────────────────── */

import { useState, useEffect } from "react";
import AppLoader from "@/components/AppLoader";

const LOADER_KEY = "arc_loader_done";

export default function AppLoaderWrapper({ children }: { children: React.ReactNode }) {
  // ── null = ما زلنا نتحقق (قبل hydration)
  // ── true  = أظهر الـ loader
  // ── false = الـ loader انتهى أو سبق مشاهدته
  const [showLoader, setShowLoader] = useState<boolean | null>(null);

  useEffect(() => {
    // هذا الكود يعمل فقط في المتصفح (بعد hydration)
    const alreadyDone = sessionStorage.getItem(LOADER_KEY);
    if (alreadyDone) {
      // سبق مشاهدة الـ loader في هذه الجلسة → لا داعي لإظهاره
      setShowLoader(false);
    } else {
      // أول مرة في هذه الجلسة → أظهر الـ loader
      setShowLoader(true);
    }
  }, []);

  // ── عند اكتمال التحميل ──
  const handleLoaderDone = () => {
    sessionStorage.setItem(LOADER_KEY, "true");
    setShowLoader(false);
  };

  return (
    <>
      {/* شاشة التحميل — تظهر فوق كل شيء (z-[9999]) عند أول زيارة في الجلسة */}
      {showLoader === true && <AppLoader onDone={handleLoaderDone} />}

      {/* محتوى التطبيق الحقيقي — يُحمَّل في الخلفية أثناء شاشة التحميل */}
      {children}
    </>
  );
}

