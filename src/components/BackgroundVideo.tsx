"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";

/* ─────────────────────────────────────────────────────────────────────────────
   مقاطع الفيديو المحلية من مجلد /public/videos
   تعمل الواحدة تلو الأخرى بشكل متكرر لا نهائي
   ─── إصلاح: كروس فيد بين فيديوين لمنع ظهور الخلفية الفارغة ───
───────────────────────────────────────────────────────────────────────────── */
const VIDEOS = [
  "/videos/5198159-uhd_3840_2160_25fps.mp4",
  "/videos/5200018-uhd_3840_2160_25fps.mp4",
  "/videos/5200020-uhd_3840_2160_25fps.mp4",
];

export default function BackgroundVideo() {
  const { isDark } = useTheme();

  /* فيديو A و B — يتبادلان الأدوار (الظاهر / المُحَمَّل التالي) */
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);

  /* أي طبقة ظاهرة حالياً: "A" أو "B" */
  const [activeLayer, setActiveLayer] = useState<"A" | "B">("A");

  /* فهرس الفيديو الحالي لكل طبقة */
  const [indexA, setIndexA] = useState(0);
  const [indexB, setIndexB] = useState(1 % VIDEOS.length);

  /* هل الطبقة الخاملة جاهزة للتشغيل؟ */
  const [nextReady, setNextReady] = useState(false);

  /* ── عند انتهاء الفيديو النشط: انتقل للطبقة الأخرى ── */
  const handleEnded = useCallback(() => {
    /* الطبقة الخاملة جاهزة بالفعل → شغّلها وانتقل */
    const inactiveRef = activeLayer === "A" ? videoBRef : videoARef;

    /* شغّل الفيديو التالي */
    inactiveRef.current?.play().catch(() => {});

    /* بدّل الطبقة الظاهرة */
    setActiveLayer((prev) => (prev === "A" ? "B" : "A"));
    setNextReady(false);
  }, [activeLayer]);

  /* ── بعد تبديل الطبقة: حمّل الفيديو التالي في الطبقة الخاملة ── */
  useEffect(() => {
    if (activeLayer === "A") {
      /* A ظاهر → B خامل → حمّل الفيديو التالي بعد A */
      const nextIdx = (indexA + 1) % VIDEOS.length;
      setIndexB(nextIdx);
    } else {
      /* B ظاهر → A خامل → حمّل الفيديو التالي بعد B */
      const nextIdx = (indexB + 1) % VIDEOS.length;
      setIndexA(nextIdx);
    }
  }, [activeLayer]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── عندما تصبح الطبقة الخاملة جاهزة ── */
  const handleCanPlay = useCallback(() => {
    setNextReady(true);
  }, []);

  /* ── الأنماط المشتركة لكلا الفيديوين ── */
  const videoBaseClass =
    "fixed inset-0 w-full h-full object-cover -z-20 pointer-events-none transition-opacity duration-700 ease-in-out";

  return (
    <>
      {/* ── فيديو A ── */}
      <video
        ref={videoARef}
        autoPlay={activeLayer === "A"}
        muted
        playsInline
        preload="auto"
        onEnded={activeLayer === "A" ? handleEnded : undefined}
        onCanPlay={activeLayer !== "A" ? handleCanPlay : undefined}
        className={videoBaseClass}
        style={{ opacity: activeLayer === "A" ? 1 : 0 }}
        src={VIDEOS[indexA]}
      />

      {/* ── فيديو B ── */}
      <video
        ref={videoBRef}
        autoPlay={activeLayer === "B"}
        muted
        playsInline
        preload="auto"
        onEnded={activeLayer === "B" ? handleEnded : undefined}
        onCanPlay={activeLayer !== "B" ? handleCanPlay : undefined}
        className={videoBaseClass}
        style={{ opacity: activeLayer === "B" ? 1 : 0 }}
        src={VIDEOS[indexB]}
      />

      {/* ── طبقة التعتيم الخفيفة ──
          الوضع الداكن : تعتيم نيفي خفيف 45%
          الوضع الفاتح : تعتيم كريمي خفيف 35%
          بدون blur حتى لا يُضبّب الفيديو
      */}
      <div
        className="fixed inset-0 -z-10 transition-colors duration-500 pointer-events-none"
        style={{
          backgroundColor: isDark
            ? "rgba(10, 41, 71, 0.45)"     /* Navy خفيف للوضع الليلي */
            : "rgba(255, 250, 243, 0.35)", /* كريمي شفاف للوضع النهاري */
        }}
      />
    </>
  );
}
