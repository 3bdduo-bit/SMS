/* ─────────────────────────────────────────────────────────────────────────────
   src/lib/theme/colors.ts
   ألوان الثيمين النهاري والليلي

   مريح للعيون:
   - النهار: خلفية كريمية دافئة
   - الليل: كحلي داكن دافئ (وليس أسوداً قاسياً)
───────────────────────────────────────────────────────────────────────────── */

/* ── ألوان الوضع النهاري ── */
export const LIGHT = {
  page:      "#FFFAF3",                       /* خلفية الصفحة */
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

/* ── ألوان الوضع الليلي (مريحة للعيون — ليست سوداء قاسية) ── */
export const DARK = {
  page:      "#0D1B2A",                       /* خلفية داكنة دافئة */
  card:      "#142235",                       /* بطاقات داكنة */
  nav:       "#0F1E30",                       /* navbar داكن */
  input:     "#1A2D42",                       /* inputs داكنة */
  hero:      "#0F1E30",                       /* hero داكن */
  border:    "#1E3550",                       /* حدود داكنة */
  borderA:   "#2A4A6E",                       /* حدود تمييز */
  textP:     "#E8F4FD",                       /* نص أبيض ناعم */
  textS:     "#A8C8E8",                       /* نص ثانوي أزرق فاتح */
  textM:     "#5E7A94",                       /* نص خافت */
  icon:      "rgba(168,200,232,0.12)",
  navShadow: "0 1px 8px rgba(0,0,0,0.4)",
  cardSh:    "0 4px 24px rgba(0,0,0,0.3)",
  cardHovSh: "0 12px 32px rgba(0,0,0,0.5)",
} as const;

/* نوع الألوان (مبسط ليكون string بدلاً من القيم الحرفية الثابتة) */
export type ThemeColors = Record<keyof typeof LIGHT, string>;

/* دالة مساعدة: ترجع الألوان المناسبة للثيم الحالي */
export function getColors(isDark: boolean): ThemeColors {
  return isDark ? DARK : LIGHT;
}
