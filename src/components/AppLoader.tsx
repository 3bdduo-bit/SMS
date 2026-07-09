"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   AppLoader — شاشة تحميل ترحيبية متحركة
   - تظهر أول مرة يفتح المستخدم الموقع فقط (sessionStorage)
   - تنتظر تحميل الفيديوهات الخلفية + الصور الأساسية
   - تُظهر رسوم متحركة بثيمة مدرسية أثناء الانتظار
   - عند اكتمال التحميل → fade out ثم تختفي
───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState, useCallback } from "react";

// ── الفيديوهات المطلوب تحميلها (نفس قائمة BackgroundVideo) ──
const VIDEOS = [
  "/videos/5198159-uhd_3840_2160_25fps.mp4",
  "/videos/5200018-uhd_3840_2160_25fps.mp4",
  "/videos/5200020-uhd_3840_2160_25fps.mp4",
];

// ── الصور المطلوب تحميلها ──
const IMAGES = ["/arc-logo.jpg"];

// ── رسائل التحميل المتسلسلة (بالعربية) ──
const LOADING_MESSAGES = [
  "جارٍ تهيئة البيئة التعليمية…",
  "تحميل الموارد المرئية…",
  "إعداد الفيديو الخلفي…",
  "تحميل الأصول…",
  "جارٍ الإنهاء…",
];

interface AppLoaderProps {
  onDone: () => void; // callback عند اكتمال التحميل
}

export default function AppLoader({ onDone }: AppLoaderProps) {
  // ── الحالة العامة ──
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [phase, setPhase]       = useState<"loading" | "fadeOut">("loading");
  const [particles, setParticles] = useState<
    { id: number; x: number; delay: number; size: number; icon: string }[]
  >([]);
  const [dots, setDots] = useState("");

  // ── مرجع المنع من التكرار ──
  const doneRef = useRef(false);

  // ── توليد جسيمات الخلفية (أيقونات مدرسية) ──
  useEffect(() => {
    const schoolIcons = ["📚", "✏️", "📐", "🎒", "📝", "🔬", "📏", "🖊️", "📓", "🏫"];
    const generated = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 8,
      size: 0.8 + Math.random() * 1.4,
      icon: schoolIcons[Math.floor(Math.random() * schoolIcons.length)],
    }));
    setParticles(generated);
  }, []);

  // ── النقاط المتحركة ──
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 450);
    return () => clearInterval(interval);
  }, []);

  // ── تغيير الرسائل تدريجيًا ──
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => Math.min(i + 1, LOADING_MESSAGES.length - 1));
    }, 900);
    return () => clearInterval(interval);
  }, []);

  // ── دالة الإنهاء (fade out ثم onDone) ──
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setProgress(100);
    setTimeout(() => setPhase("fadeOut"), 400);
    setTimeout(() => onDone(), 1200);
  }, [onDone]);

  // ── تحميل جميع الموارد ──
  useEffect(() => {
    // الإجمالي: أول فيديو فقط + جميع الصور
    const totalItems = 1 + IMAGES.length;
    let loadedCount  = 0;

    // دالة لتحديث التقدم
    const tick = () => {
      loadedCount++;
      const pct = Math.round((loadedCount / totalItems) * 95);
      setProgress((prev) => Math.max(prev, pct));
      if (loadedCount >= totalItems) finish();
    };

    // ── تحميل الصور ──
    IMAGES.forEach((src) => {
      const img = new window.Image();
      img.src     = src;
      img.onload  = tick;
      img.onerror = tick;
    });

    // ── تحميل الفيديو الأول (canplaythrough) ──
    const video = document.createElement("video");
    video.src     = VIDEOS[0];
    video.muted   = true;
    video.preload = "auto";

    const onCanPlay = () => {
      tick();
      video.removeEventListener("canplaythrough", onCanPlay);
    };
    const onError = () => {
      tick();
      video.removeEventListener("error", onError);
    };
    video.addEventListener("canplaythrough", onCanPlay);
    video.addEventListener("error", onError);
    video.load();

    // ── حد أقصى للانتظار: 12 ثانية ──
    const maxWait = setTimeout(() => finish(), 12_000);

    // ── شريط تقدم وهمي (يتحرك دائمًا حتى 85%) ──
    let fakeProgress = 0;
    const fakeInterval = setInterval(() => {
      fakeProgress += 1.2;
      if (fakeProgress >= 85) { clearInterval(fakeInterval); return; }
      setProgress((prev) => Math.max(prev, Math.round(fakeProgress)));
    }, 80);

    return () => {
      clearTimeout(maxWait);
      clearInterval(fakeInterval);
    };
  }, [finish]);

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden
        transition-opacity duration-700 ease-in-out
        ${phase === "fadeOut" ? "opacity-0 pointer-events-none" : "opacity-100"}
      `}
      style={{ backgroundColor: "#0A2947" }}
    >
      {/* ── خلفية: نقاط + توهج + جسيمات مدرسية طائرة ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* شبكة نقاط ناعمة */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(168,200,232,0.12) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        {/* توهج مركزي */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: "600px", height: "600px",
            background:
              "radial-gradient(circle, rgba(168,200,232,0.08) 0%, transparent 70%)",
          }}
        />
        {/* جسيمات مدرسية طائرة */}
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute select-none"
            style={{
              left:     `${p.x}%`,
              bottom:   "-2rem",
              fontSize: `${p.size}rem`,
              opacity:  0.35,
              animation: `floatUp ${6 + p.delay * 0.8}s linear ${p.delay}s infinite`,
            }}
          >
            {p.icon}
          </span>
        ))}
      </div>

      {/* ── المحتوى الرئيسي ── */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 w-full max-w-sm">

        {/* ── الشعار مع حلقات دوّارة ── */}
        <div className="relative flex items-center justify-center">
          {/* حلقة خارجية */}
          <div
            className="absolute rounded-full border-2"
            style={{
              width: "160px", height: "160px",
              borderColor: "rgba(168,200,232,0.25)",
              animation: "spinRing 6s linear infinite",
            }}
          />
          {/* حلقة وسطى عكسية */}
          <div
            className="absolute rounded-full border-2"
            style={{
              width: "130px", height: "130px",
              borderColor: "rgba(255,242,219,0.20)",
              animation: "spinRingReverse 4s linear infinite",
            }}
          />
          {/* حلقة داخلية متوهجة */}
          <div
            className="absolute"
            style={{
              width: "110px", height: "110px",
              border: "3px solid transparent",
              borderTopColor: "#A8C8E8",
              borderRightColor: "rgba(168,200,232,0.4)",
              borderRadius: "50%",
              animation: "spinRing 1.5s linear infinite",
            }}
          />
          {/* الشعار المركزي */}
          <div
            className="relative rounded-full overflow-hidden border-4"
            style={{
              width: "90px", height: "90px",
              borderColor: "rgba(168,200,232,0.5)",
              boxShadow: "0 0 30px rgba(168,200,232,0.25)",
              animation: "logoPulse 2.5s ease-in-out infinite",
              background: "#0D1E2E",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/arc-logo.jpg"
              alt="شعار ARC"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>

        {/* ── العنوان ── */}
        <div className="text-center" style={{ animation: "fadeUp 0.8s ease-out 0.2s both" }}>
          <h1
            className="font-extrabold tracking-widest text-4xl"
            style={{ color: "#A8C8E8" }}
          >
            ARC
          </h1>
          <p className="mt-1 text-sm tracking-wide" style={{ color: "rgba(168,200,232,0.7)" }}>
            المنصة التعليمية المتكاملة
          </p>
        </div>

        {/* ── شريط التقدم ── */}
        <div className="w-full" style={{ animation: "fadeUp 0.8s ease-out 0.5s both" }}>
          <div
            className="relative w-full rounded-full overflow-hidden"
            style={{ height: "6px", background: "rgba(168,200,232,0.15)" }}
          >
            <div
              className="absolute inset-y-0 right-0 rounded-full transition-all duration-300 ease-out"
              style={{
                width:     `${progress}%`,
                background: "linear-gradient(90deg, #A8C8E8, #FFF2DB)",
                boxShadow:  "0 0 8px rgba(168,200,232,0.6)",
              }}
            />
          </div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-xs" style={{ color: "rgba(168,200,232,0.55)" }}>
              {LOADING_MESSAGES[msgIndex]}{dots}
            </span>
            <span className="text-xs font-bold tabular-nums" style={{ color: "#A8C8E8" }}>
              {progress}%
            </span>
          </div>
        </div>

        {/* ── أيقونات المواد الدراسية ── */}
        <div className="flex gap-5 mt-2" style={{ animation: "fadeUp 0.8s ease-out 0.8s both" }}>
          {["📚", "✏️", "📐", "🔬", "🎒"].map((icon, i) => (
            <span
              key={i}
              className="text-xl select-none"
              style={{
                opacity:   0.7,
                animation: `iconBounce 1.8s ease-in-out ${i * 0.15}s infinite`,
              }}
            >
              {icon}
            </span>
          ))}
        </div>

        {/* ── اسم النظام ── */}
        <p
          className="text-[10px] tracking-widest uppercase"
          style={{ color: "rgba(168,200,232,0.35)", animation: "fadeUp 0.8s ease-out 1.1s both" }}
        >
          School Management System
        </p>
      </div>

      {/* ── keyframes ── */}
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
          0%, 100% { transform: scale(1);    box-shadow: 0 0 20px rgba(168,200,232,0.2); }
          50%      { transform: scale(1.05); box-shadow: 0 0 40px rgba(168,200,232,0.4); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatUp {
          0%   { transform: translateY(0) rotate(0deg);     opacity: 0.35; }
          10%  { opacity: 0.35; }
          90%  { opacity: 0.15; }
          100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
        }
        @keyframes iconBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
