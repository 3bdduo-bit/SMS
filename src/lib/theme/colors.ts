/* ─────────────────────────────────────────────────────────────────────────────
   src/lib/theme/colors.ts
   ألوان الثيمين النهاري والليلي

   مريح للعيون:
   - النهار: كريمي دافئ + كحلي
   - الليل: كحلي عميق ناعم + أزرق سماوي خافت (نسخة ليلية من الهوية)
───────────────────────────────────────────────────────────────────────────── */

/* ── ألوان الوضع النهاري ── */
export const LIGHT = {
  page:      "transparent",                       /* خلفية الصفحة */
  card:      "#FFFFFF",                       /* خلفية البطاقات */
  nav:       "#FFFFFF",                       /* خلفية الـ navbar */
  input:     "#FFFAF3",                       /* خلفية الـ inputs */
  hero:      "#0A2947",                       /* خلفية الـ hero */
  border:    "#FFF2DB",                       /* لون الحدود */
  borderA:   "#A8C8E8",                       /* حدود التمييز */
  textP:     "#0A2947",                       /* النص الأساسي */
  textS:     "#4B6280",                       /* النص الثانوي */
  textM:     "#9CA3AF",                       /* النص الخافت */
  icon:      "rgba(168,200,232,0.20)",        /* خلفية الأيقونات */
  navShadow: "0 1px 8px rgba(10,41,71,0.08)",
  cardSh:    "0 4px 24px rgba(10,41,71,0.07)",
  cardHovSh: "0 12px 32px rgba(10,41,71,0.14)",
} as const;

/* ── لوحة الوضع الليلي — كحلي عميق مريح (ليست سوداء قاسية) ── */
export const DARK_PALETTE = {
  deep:   "#0D1520",   /* قاعدة الخلفية */
  slate:  "#151F2E",   /* أسطح مرتفعة */
  navy:   "#0A2947",   /* كحلي العلامة — hero */
  accent: "#8BAFCE",   /* أزرق سماوي خافت */
} as const;

/* ── ألوان الوضع الليلي ── */
export const DARK = {
  page:      "transparent",               /* خلفية الصفحة */
  card:      DARK_PALETTE.slate,             /* بطاقات */
  nav:       "#0F1929",                       /* navbar — طبقة بين الصفحة والبطاقة */
  input:     "#1A2538",                       /* inputs */
  hero:      DARK_PALETTE.navy,               /* hero — نفس كحلي النهار */
  border:    "#243044",                       /* حدود ناعمة */
  borderA:   "#3D5A73",                       /* حدود تمييز */
  textP:     "#E8EDF3",                       /* نص أساسي — أبيض مزرق ناعم */
  textS:     "#9BB4CC",                       /* نص ثانوي */
  textM:     "#5E7085",                       /* نص خافت */
  icon:      "rgba(168,200,232,0.10)",        /* خلفية الأيقونات */
  navShadow: "0 1px 10px rgba(0,0,0,0.35)",
  cardSh:    "0 4px 20px rgba(0,0,0,0.28)",
  cardHovSh: "0 12px 36px rgba(0,0,0,0.42)",
} as const;

/* نوع الألوان (مبسط ليكون string بدلاً من القيم الحرفية الثابتة) */
export type ThemeColors = Record<keyof typeof LIGHT, string>;

/* دالة مساعدة: ترجع الألوان المناسبة للثيم الحالي */
export function getColors(isDark: boolean): ThemeColors {
  return isDark ? DARK : LIGHT;
}
