"use client";

import { useRef, useState, useCallback } from "react";
import { useTheme } from "@/components/ThemeProvider";

/* ─────────────────────────────────────────────────────────────────────────────
   مقاطع الفيديو المحلية من مجلد /public/videos
   تعمل الواحدة تلو الأخرى بشكل متكرر لا نهائي
───────────────────────────────────────────────────────────────────────────── */
const VIDEOS = [
  "/videos/5198159-uhd_3840_2160_25fps.mp4",
  "/videos/5200018-uhd_3840_2160_25fps.mp4",
  "/videos/5200020-uhd_3840_2160_25fps.mp4",
];

export default function BackgroundVideo() {
  const { isDark } = useTheme();

  /* رقم الفيديو الحالي */
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* عند انتهاء الفيديو انتقل إلى التالي، وعند الأخير ارجع للأول */
  const handleEnded = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % VIDEOS.length);
  }, []);

  return (
    <>
      {/* ── الفيديو الرئيسي ── fixed يجعله يظهر خلف جميع الصفحات */}
      <video
        key={currentIndex}           /* تغيير key يُجبر React على تحميل الفيديو الجديد */
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        className="fixed inset-0 w-full h-full object-cover -z-20 pointer-events-none"
        src={VIDEOS[currentIndex]}
      />

      {/* ── طبقة التعتيم الخفيفة ── شفافية منخفضة حتى يظهر الفيديو بوضوح ──
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
