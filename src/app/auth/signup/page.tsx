"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   صفحة إنشاء الحساب  /auth/signup

   - متجاوبة مع جميع الشاشات (موبايل → تابلت → سطح مكتب)
   - تعتمد على إطار العمل Tailwind CSS ومكتبة الأيقونات lucide-react
   - تقوم بإرسال البيانات (POST) إلى السيرفر الخاص بالمنصة
   - الألوان المستخدمة: 
     #0A2947 (كحلي أساسي) / #A8C8E8 (أزرق فاتح ثانوي) / 
     #FFF2DB (خوخي للإطارات) / #FFFAF3 (كريمي للخلفية)
───────────────────────────────────────────────────────────────────────────── */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, UserPlus, Lock, User, Phone, AlertCircle, CheckCircle2, AtSign, GraduationCap
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  /* 
   * ── حالة النموذج (Form State) ──
   * هنا نقوم بتخزين كل القيم التي يدخلها المستخدم في الحقول
   */
  const [fullName, setFullName]               = useState("");
  const [userName, setUserName]               = useState(""); // اسم المستخدم (camelCase كما يتوقعه الباك إند)
  const [phoneNumber, setPhoneNumber]         = useState("");
  const [level, setLevel]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /* 
   * ── حالة الواجهة (UI State) ──
   * هنا نتحكم في شكل الواجهة مثل إظهار/إخفاء كلمة المرور وحالة التحميل والأخطاء
   */
  const [showPassword, setShowPassword] = useState(false); // إظهار أو إخفاء كلمة المرور الأساسية
  const [showConfirm, setShowConfirm]   = useState(false); // إظهار أو إخفاء حقل تأكيد كلمة المرور
  const [loading, setLoading]           = useState(false); // حالة التحميل (لإظهار دائرة التحميل أثناء الاتصال بالسيرفر)
  const [success, setSuccess]           = useState("");    // رسالة النجاح التي تظهر بعد إنشاء الحساب

  // كائن (Object) يحتوي على رسائل الخطأ لكل حقل على حدة
  const [errors, setErrors]             = useState<{
    fullName?: string;
    username?: string;
    phoneNumber?: string;
    level?: string;
    password?: string;
    confirmPassword?: string;
    general?: string; // أخطاء عامة مثل فشل الاتصال بالسيرفر
  }>({});

  /* 
   * ── دالة اقتراح اسم مستخدم (Username Suggester) ──
   * تقوم بتوليد اسم مستخدم عشوائي بناءً على رقم ليساعد الطالب
   */
  const suggestUserName = () => {
    // توليد رقم عشوائي بين 1000 و 9999
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    // دمج كلمة student مع الرقم العشوائي لتوليد اسم مستخدم جاهز
    const newUserName = `student_${randomNum}`;
    
    setUserName(newUserName);
    
    // إذا كان هناك خطأ سابق في اسم المستخدم، نقوم بمسحه لأننا وضعنا اسماً صحيحاً الآن
    if (errors.username) setErrors(prev => ({ ...prev, username: undefined }));
  };

  /* 
   * ── دالة التحقق الفردي (Warner for each input) ──
   * تعمل هذه الدالة بمجرد أن يترك المستخدم الحقل (onBlur) 
   * لتعطيه تنبيهاً فورياً إذا كان إدخاله غير صحيح
   */
  const handleBlur = (field: string, value: string) => {
    let error: string | undefined = undefined;
    
    switch (field) {
      case "fullName":
        if (!value) error = "الاسم الكامل مطلوب";
        else if (!/^[\u0621-\u064A\s]+$/.test(value)) error = "يجب أن يكون الاسم باللغة العربية فقط";
        else if (value.trim().split(/\s+/).length < 3) error = "يجب أن يكون الاسم ثلاثياً على الأقل";
        break;
      case "userName":
        if (!value) error = "اسم المستخدم مطلوب";
        else if (value.length < 3) error = "اسم المستخدم يجب أن يكون 3 أحرف على الأقل";
        else if (!/^[a-zA-Z0-9_]+$/.test(value)) error = "اسم المستخدم يجب أن يحتوي على حروف إنجليزية وأرقام فقط (بدون مسافات)";
        break;
      case "phoneNumber":
        if (!value) error = "رقم الهاتف مطلوب";
        else if (!/^(?:\+20|0)1[0125][0-9]{8}$/.test(value)) error = "رقم الهاتف غير صحيح (يجب أن يكون رقماً مصرياً)";
        break;
      case "level":
        if (!value) error = "المرحلة الدراسية مطلوبة";
        break;
      case "password":
        if (!value) error = "كلمة المرور مطلوبة";
        else if (value.length < 8) error = "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
        break;
      case "confirmPassword":
        if (!value) error = "تأكيد كلمة المرور مطلوب";
        else if (value !== password) error = "كلمتا المرور غير متطابقتين";
        break;
    }
    
    // تحديث حالة الأخطاء بناءً على نتيجة التحقق
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  /* 
   * ── معالج الإرسال (Submit Handler) ──
   * هذه الدالة تعمل عند الضغط على زر "إنشاء الحساب"
   * وظيفتها التحقق من كل الحقول مرة أخيرة ثم إرسالها للباك إند
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // منع إعادة تحميل الصفحة
    setSuccess("");
    setErrors({}); // تصفير الأخطاء القديمة

    // التحقق من جميع الحقول قبل الإرسال
    const validationErrors: {
      fullName?: string;
      username?: string;
      phoneNumber?: string;
      level?: string;
      password?: string;
      confirmPassword?: string;
      general?: string;
    } = {};

    if (!fullName) validationErrors.fullName = "الاسم الكامل مطلوب";
    else if (!/^[\u0621-\u064A\s]+$/.test(fullName)) validationErrors.fullName = "يجب أن يكون الاسم باللغة العربية فقط";
    else if (fullName.trim().split(/\s+/).length < 3) validationErrors.fullName = "يجب أن يكون الاسم ثلاثياً على الأقل";

    if (!userName) validationErrors.username = "اسم المستخدم مطلوب";
    else if (userName.length < 3) validationErrors.username = "اسم المستخدم يجب أن يكون 3 أحرف على الأقل";
    else if (!/^[a-zA-Z0-9_]+$/.test(userName)) validationErrors.username = "اسم المستخدم يجب أن يحتوي على حروف إنجليزية وأرقام فقط (بدون مسافات)";

    if (!phoneNumber) validationErrors.phoneNumber = "رقم الهاتف مطلوب";
    else if (!/^(?:\+20|0)1[0125][0-9]{8}$/.test(phoneNumber)) validationErrors.phoneNumber = "رقم الهاتف غير صحيح (يجب أن يكون رقماً مصرياً)";

    if (!level) validationErrors.level = "المرحلة الدراسية مطلوبة";

    if (!password) validationErrors.password = "كلمة المرور مطلوبة";
    else if (password.length < 8) validationErrors.password = "كلمة المرور يجب أن تكون 8 أحرف على الأقل";

    if (password !== confirmPassword) {
      validationErrors.confirmPassword = "كلمتا المرور غير متطابقتين";
    }

    // إذا وجدنا أي أخطاء، نوقف عملية الإرسال ونعرض الأخطاء
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // إذا كانت البيانات صحيحة، نبدأ التحميل
    setLoading(true);
    try {
      // رابط الباك إند
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://educationplatform2-production.up.railway.app";

      // إرسال البيانات (POST)
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // تجميع البيانات في كائن JSON
        body: JSON.stringify({ fullName, userName, password, phoneNumber, level }), // userName بحرف N كبير كما يتوقعه الباك إند
      });

      const data = await res.json().catch(() => ({}));

      // في حال وجود خطأ من السيرفر (مثل اسم المستخدم مأخوذ مسبقاً)
      if (!res.ok) {
        let detail =
          data?.errorDetails?.[0]?.message ||
          data?.message ||
          "فشل إنشاء الحساب. الرجاء التحقق من البيانات.";
          
        // ترجمة رسائل الخطأ من الباك إند لتكون واضحة وبالعربية للطالب
        if (detail.includes("Invalid option") || detail.includes("expected one of")) {
          detail = "عذراً، المرحلة الدراسية التي اخترتها غير مفعلة حالياً في الخادم. (يرجى مراجعة الإدارة)";
        } else if (detail.toLowerCase().includes("exist") || detail.toLowerCase().includes("taken")) {
          detail = "اسم المستخدم أو رقم الهاتف أو البريد الإلكتروني مسجل مسبقاً.";
        }

        throw new Error(detail);
      }

      // في حال النجاح
      setSuccess("تم إنشاء الحساب بنجاح! جارٍ التحويل…");
      // توجيه المستخدم لصفحة الطالب بعد نصف ثانية
      setTimeout(() => router.push("/student"), 600);
    } catch (err: unknown) {
      // عرض رسالة الخطأ العام
      setErrors({ general: err instanceof Error ? err.message : "حدث خطأ غير متوقع." });
    } finally {
      // إيقاف دائرة التحميل في كل الأحوال
      setLoading(false);
    }
  };

  /* 
   * ── دالة مساعدة لتوليد كلاسات (CSS Classes) حقول الإدخال ──
   * تستقبل رسالة الخطأ، وإذا وجدت تُلوّن الحقل بالأحمر، وإلا بالألوان الأساسية
   */
  const getInputClass = (errorMsg?: string) => `
    w-full py-2.5 sm:py-3 rounded-xl border-2 bg-[#FFFAF3]
    text-[#0A2947] placeholder-gray-300 text-sm
    outline-none transition-all duration-300 focus:bg-white
    ${errorMsg
      ? "border-red-400 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(248,113,113,0.2)]"
      : "border-[#FFF2DB] focus:border-[#A8C8E8] focus:shadow-[0_0_0_4px_rgba(168,200,232,0.35)] hover:border-[#A8C8E8]/60"
    }
  `;

  /* 
   * ── كلاس مشترك لزر إظهار/إخفاء كلمة المرور ──
   */
  const eyeBtnBase = `
    absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2
    text-gray-400 hover:text-[#0A2947]
    transition-all duration-200
    p-1 rounded-md hover:bg-[#FFF2DB]
    active:scale-90 cursor-pointer
  `;

  /* ─────────────────────── بدء واجهة المستخدم (JSX) ─────────────────────── */
  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-[#FFFAF3] px-4 py-8 sm:py-12">
      <div
        className="
          w-full max-w-sm sm:max-w-md
          bg-white border border-[#FFF2DB] shadow-xl
          rounded-2xl sm:rounded-3xl
          p-6 sm:p-8 md:p-10
          animate-[fadeUp_0.4s_ease-out_forwards]
        "
      >
        {/* ── شعار الصفحة (أيقونة إنشاء الحساب) ── */}
        <div className="flex justify-center mb-5 sm:mb-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0A2947]
                          flex items-center justify-center shadow-lg
                          transition-transform duration-300 hover:scale-105">
            <UserPlus className="w-7 h-7 sm:w-8 sm:h-8 text-[#A8C8E8]" />
          </div>
        </div>

        {/* ── العنوان الرئيسي والوصف ── */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A2947] text-center tracking-tight mb-1">
          إنشاء حساب جديد
        </h1>
        <p className="text-center text-gray-400 text-xs sm:text-sm mb-6 sm:mb-8">
          انضم إلينا اليوم — التسجيل لا يأخذ سوى لحظات
        </p>

        {/* ── تنبيه الخطأ العام (مثل خطأ السيرفر) ── */}
        {errors.general && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700
                          rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 mb-4 sm:mb-5 text-xs sm:text-sm font-medium
                          animate-[fadeUp_0.25s_ease-out_forwards]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* ── تنبيه النجاح ── */}
        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700
                          rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 mb-4 sm:mb-5 text-xs sm:text-sm font-medium
                          animate-[fadeUp_0.25s_ease-out_forwards]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* ── بداية نموذج الإدخال (Form) ── */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

          {/* ── حقل الاسم الكامل ── */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <label htmlFor="signup-name" className="text-xs sm:text-sm font-semibold text-[#0A2947]">
              الاسم الكامل
            </label>
            <div className="relative group">
              {/* أيقونة المستخدم */}
              <User className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2
                               w-4 h-4 text-gray-400 pointer-events-none
                               transition-colors duration-200 group-focus-within:text-[#0A2947]" />
              <input
                id="signup-name"
                type="text"
                placeholder="محمد أحمد علي"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  // إخفاء الخطأ فوراً عند التعديل
                  if (errors.fullName) setErrors(prev => ({ ...prev, fullName: undefined }));
                }}
                onBlur={(e) => handleBlur("fullName", e.target.value)}
                className={`pr-9 sm:pr-10 pl-4 ${getInputClass(errors.fullName)}`}
              />
            </div>
            {/* رسالة الخطأ الخاصة بالاسم */}
            {errors.fullName && (
              <span className="text-red-500 text-xs font-medium animate-[fadeUp_0.2s_ease-out_forwards] flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.fullName}
              </span>
            )}
          </div>

          {/* ── حقل اسم المستخدم مع زر الاقتراح ── */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="signup-username" className="text-xs sm:text-sm font-semibold text-[#0A2947]">
                اسم المستخدم
              </label>
              {/* زر اقتراح اسم مستخدم */}
              <button 
                type="button" 
                onClick={suggestUserName}
                className="text-[10px] sm:text-xs text-[#0A2947] bg-[#FFF2DB] hover:bg-[#A8C8E8] 
                           px-2 py-1 rounded-md font-bold transition-colors shadow-sm"
              >
                اقتراح اسم؟
              </button>
            </div>
            <div className="relative group">
              <AtSign className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2
                               w-4 h-4 text-gray-400 pointer-events-none
                               transition-colors duration-200 group-focus-within:text-[#0A2947]" />
              <input
                id="signup-username"
                type="text"
                placeholder="user_123"
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  // مسح رسالة الخطأ عند بدء الكتابة
                  if (errors.username) setErrors(prev => ({ ...prev, username: undefined }));
                }}
                onBlur={(e) => handleBlur("userName", e.target.value)}
                className={`pr-9 sm:pr-10 pl-4 ${getInputClass(errors.username)}`}
                dir="ltr"
              />
            </div>
            {/* رسالة الخطأ الخاصة باسم المستخدم */}
            {errors.username && (
              <span className="text-red-500 text-xs font-medium animate-[fadeUp_0.2s_ease-out_forwards] flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.username}
              </span>
            )}
          </div>

          {/* ── حقل رقم الهاتف ── */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <label htmlFor="signup-phone" className="text-xs sm:text-sm font-semibold text-[#0A2947]">
              رقم الهاتف
            </label>
            <div className="relative group">
              <Phone className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2
                                w-4 h-4 text-gray-400 pointer-events-none
                                transition-colors duration-200 group-focus-within:text-[#0A2947]" />
              <input
                id="signup-phone"
                type="tel"
                placeholder="01XXXXXXXXX"
                value={phoneNumber}
                onChange={(e) => {
                  // السماح بالأرقام فقط
                  const val = e.target.value.replace(/[^\d+]/g, "");
                  setPhoneNumber(val);
                  if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: undefined }));
                }}
                onBlur={(e) => handleBlur("phoneNumber", e.target.value.replace(/[^\d+]/g, ""))}
                className={`pr-9 sm:pr-10 pl-4 ${getInputClass(errors.phoneNumber)}`}
                dir="ltr"
              />
            </div>
            {errors.phoneNumber && (
              <span className="text-red-500 text-xs font-medium animate-[fadeUp_0.2s_ease-out_forwards] flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.phoneNumber}
              </span>
            )}
          </div>

          {/* ── حقل المرحلة الدراسية (قائمة منسدلة) ── */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <label htmlFor="signup-level" className="text-xs sm:text-sm font-semibold text-[#0A2947]">
              المرحلة الدراسية
            </label>
            <div className="relative group">
              <GraduationCap className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2
                               w-4 h-4 text-gray-400 pointer-events-none
                               transition-colors duration-200 group-focus-within:text-[#0A2947]" />
              <select
                id="signup-level"
                value={level}
                onChange={(e) => {
                  setLevel(e.target.value);
                  if (errors.level) setErrors(prev => ({ ...prev, level: undefined }));
                }}
                onBlur={(e) => handleBlur("level", e.target.value)}
                className={`pr-9 sm:pr-10 pl-4 appearance-none ${getInputClass(errors.level)}`}
              >
                <option value="" disabled>اختر المرحلة الدراسية</option>
                
                <optgroup label="المرحلة الابتدائية">
                  <option value="one">الصف الأول الابتدائي</option>
                  <option value="two">الصف الثاني الابتدائي</option>
                  <option value="three">الصف الثالث الابتدائي</option>
                  <option value="four">الصف الرابع الابتدائي</option>
                  <option value="five">الصف الخامس الابتدائي</option>
                  <option value="six">الصف السادس الابتدائي</option>
                </optgroup>

                <optgroup label="المرحلة الإعدادية">
                  <option value="seven">الصف الأول الإعدادي</option>
                  <option value="eight">الصف الثاني الإعدادي</option>
                  <option value="nine">الصف الثالث الإعدادي</option>
                </optgroup>

                <optgroup label="المرحلة الثانوية">
                  <option value="ten">الصف الأول الثانوي</option>
                  <option value="eleven">الصف الثاني الثانوي</option>
                  <option value="twelve">الصف الثالث الثانوي</option>
                </optgroup>
              </select>
            </div>
            {errors.level && (
              <span className="text-red-500 text-xs font-medium animate-[fadeUp_0.2s_ease-out_forwards] flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.level}
              </span>
            )}
          </div>

          {/* ── حقل كلمة المرور ── */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <label htmlFor="signup-password" className="text-xs sm:text-sm font-semibold text-[#0A2947]">
              كلمة المرور
            </label>
            <div className="relative group">
              <Lock className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2
                              w-4 h-4 text-gray-400 pointer-events-none
                              transition-colors duration-200 group-focus-within:text-[#0A2947]" />
              <input
                id="signup-password"
                // إظهار وإخفاء كلمة المرور بناءً على حالة showPassword
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                }}
                onBlur={(e) => handleBlur("password", e.target.value)}
                className={`pr-9 sm:pr-10 pl-10 sm:pl-11 ${getInputClass(errors.password)}`}
                dir="ltr"
              />
              {/* زر الإظهار/الإخفاء */}
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className={eyeBtnBase}
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password ? (
              <span className="text-red-500 text-xs font-medium animate-[fadeUp_0.2s_ease-out_forwards] flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.password}
              </span>
            ) : (
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">٨ أحرف على الأقل</p>
            )}
          </div>

          {/* ── حقل تأكيد كلمة المرور ── */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <label htmlFor="signup-confirm" className="text-xs sm:text-sm font-semibold text-[#0A2947]">
              تأكيد كلمة المرور
            </label>
            <div className="relative group">
              <Lock className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2
                              w-4 h-4 text-gray-400 pointer-events-none
                              transition-colors duration-200 group-focus-within:text-[#0A2947]" />
              <input
                id="signup-confirm"
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                }}
                onBlur={(e) => handleBlur("confirmPassword", e.target.value)}
                className={`pr-9 sm:pr-10 pl-10 sm:pl-11 ${getInputClass(errors.confirmPassword)}`}
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className={eyeBtnBase}
                aria-label={showConfirm ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="text-red-500 text-xs font-medium animate-[fadeUp_0.2s_ease-out_forwards] flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.confirmPassword}
              </span>
            )}
          </div>

          {/* ── زر الإرسال (Submit Button) ── */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full py-3 sm:py-3.5 rounded-xl
              bg-[#0A2947] text-[#FFFAF3]
              font-bold text-sm tracking-wide
              flex items-center justify-center gap-2 mt-1
              transition-all duration-300 ease-in-out
              hover:bg-[#0d365e] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(10,41,71,0.3)]
              active:translate-y-0 active:shadow-md active:scale-[0.98]
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {loading ? (
              <>
                <div className="relative w-5 h-5">
                  <div className="absolute inset-0 rounded-full border-2
                                  border-[#A8C8E8]/30 border-t-[#A8C8E8] animate-spin" />
                  {/* إظهار الشعار الصغير أثناء التحميل */}
                  <div className="absolute inset-0.5 rounded-full overflow-hidden">
                    <Image src="/arc-logo.jpg" alt="" fill className="object-cover" />
                  </div>
                </div>
                جارٍ إنشاء الحساب…
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                إنشاء الحساب
              </>
            )}
          </button>
        </form>

        {/* ── فاصل ── */}
        <div className="flex items-center gap-3 my-5 sm:my-6">
          <div className="flex-1 h-px bg-[#FFF2DB]" />
          <span className="text-xs text-gray-300 font-medium">أو</span>
          <div className="flex-1 h-px bg-[#FFF2DB]" />
        </div>

        {/* ── رابط الانتقال لصفحة تسجيل الدخول ── */}
        <p className="text-center text-xs sm:text-sm text-gray-400">
          لديك حساب بالفعل؟{" "}
          <Link
            href="/auth/login"
            className="text-[#0A2947] font-bold
                       relative after:absolute after:bottom-0 after:right-0
                       after:h-[2px] after:w-0 after:bg-[#0A2947]
                       after:transition-all after:duration-300
                       hover:after:w-full"
          >
            سجّل دخولك
          </Link>
        </p>
      </div>

      {/* ── أنيميشن الظهور (Fade Up) ── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}