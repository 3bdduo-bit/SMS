"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   src/app/student/payments/page.tsx
   صفحة المدفوعات — خاصة بالطالب

   الميزات:
   - عرض حالة الدفع الحالية
   - محاكاة عملية الدفع (واجهة وهمية)
   - عرض سجل المدفوعات السابقة
   - دعم الوضع الليلي + RTL + اللغة العربية
───────────────────────────────────────────────────────────────────────────── */

import {
  GraduationCap, LogOut, ChevronLeft, AlertCircle, Loader2,
  Menu, X, CreditCard, Calendar, CheckCircle2, Clock, AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getProfile, UserProfile } from "@/lib/api/user";
import { useTheme } from "@/components/ThemeProvider";
import { getColors } from "@/lib/theme/colors";
import ThemeToggle from "@/components/ThemeToggle";

const PAYMENT_METHODS = [
  { id: "cash", label: "نقداً", icon: "💵", description: "الدفع بالكاش في المركز" },
  { id: "card", label: "بطاقة ائتمان", icon: "💳", description: "الدفع عبر البطاقة" },
  { id: "bank", label: "تحويل بنكي", icon: "🏦", description: "التحويل عبر الحساب البنكي" },
];

const PAYMENT_AMOUNTS = [
  { amount: 500, label: "500 ج.م" },
  { amount: 1000, label: "1000 ج.م" },
  { amount: 1500, label: "1500 ج.م" },
  { amount: 2000, label: "2000 ج.م" },
];

export default function StudentPaymentsPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid" | "exempt">("unpaid");
  const [paidUntil, setPaidUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>("cash");
  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  const [paymentHistory, setPaymentHistory] = useState<Array<{
    date: string;
    amount: number;
    method: string;
    status: string;
  }>>([]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tr = "transition-all duration-300 ease-in-out";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userProfile = await getProfile();
        setProfile(userProfile);
        
        // Simulate payment status from profile
        if (userProfile) {
          setPaymentStatus((userProfile as any).ispaid === "yes" ? "paid" : 
                          (userProfile as any).ispaid === "معافى" ? "exempt" : "unpaid");
          setPaidUntil((userProfile as any).paidUntil || null);
        }
        
        // Simulate payment history
        setPaymentHistory([
          { date: "2024-01-15", amount: 1000, method: "cash", status: "completed" },
          { date: "2024-02-15", amount: 1000, method: "card", status: "completed" },
        ]);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  const handlePayment = async () => {
    setProcessing(true);
    setPaymentSuccess(false);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setPaymentSuccess(true);
    setPaymentStatus("paid");
    
    // Add to payment history
    const newPayment = {
      date: new Date().toISOString().split('T')[0],
      amount: selectedAmount,
      method: selectedMethod,
      status: "completed"
    };
    setPaymentHistory([newPayment, ...paymentHistory]);
    
    // Update paid until date (3 months from now)
    const newPaidUntil = new Date();
    newPaidUntil.setMonth(newPaidUntil.getMonth() + 3);
    setPaidUntil(newPaidUntil.toISOString().split('T')[0]);
    
    setShowPaymentForm(false);
    setProcessing(false);
    
    setTimeout(() => setPaymentSuccess(false), 5000);
  };

  const formatDate = (d?: string) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch {
      return d;
    }
  };

  const getStatusBadge = () => {
    if (paymentStatus === "paid") {
      return { text: "تم الدفع", bg: "rgba(34,197,94,0.12)", col: "#16a34a", border: "rgba(34,197,94,0.4)" };
    }
    if (paymentStatus === "exempt") {
      return { text: "معافى", bg: "rgba(59,130,246,0.12)", col: "#2563eb", border: "rgba(59,130,246,0.4)" };
    }
    return { text: "لم يتم الدفع", bg: "rgba(239,68,68,0.12)", col: "#dc2626", border: "rgba(239,68,68,0.4)" };
  };

  const badge = getStatusBadge();

  return (
    <div
      className={`min-h-[100dvh] ${tr}`}
      style={{ backgroundColor: C.page, color: C.textP }}
      dir="rtl"
    >
      <nav
        className={`px-4 sm:px-8 py-3 flex justify-between items-center sticky top-0 z-50 ${tr}`}
        style={{ backgroundColor: C.nav, borderBottom: `1px solid ${C.border}`, boxShadow: C.navShadow }}
      >
        <div className="flex items-center gap-3">
          <Link href="/student" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#0A2947] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <CreditCard className="text-[#A8C8E8] w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight leading-none" style={{ color: C.textP }}>
              بوابة الطالب
            </h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: C.textM }}>
              المدفوعات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          <Link
            href="/student"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-all hover:-translate-y-0.5"
            style={{ color: C.textS, backgroundColor: C.icon }}
          >
            <GraduationCap className="w-4 h-4" />
            لوحة التحكم
          </Link>

          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1.5 text-red-500 hover:text-red-700 font-semibold text-sm transition-colors px-3 py-2 rounded-xl hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            خروج
          </button>

          <button
            className="sm:hidden p-2 rounded-xl hover:bg-black/5 transition-colors"
            style={{ color: C.textP }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div
          className="sm:hidden absolute left-0 right-0 top-[65px] z-40 p-4 border-b shadow-lg"
          style={{ backgroundColor: C.nav, borderColor: C.border }}
        >
          <div className="flex flex-col gap-3">
            <Link
              href="/student"
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-black/5"
              style={{ color: C.textP }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <GraduationCap className="w-5 h-5" />
              <span className="font-semibold text-sm">لوحة التحكم</span>
            </Link>
            <div className="flex items-center gap-3 p-2 rounded-xl" style={{ color: C.textP }}>
              <span className="font-semibold text-sm flex-1">المظهر</span>
              <ThemeToggle />
            </div>
            <button
              onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-red-50 text-red-500 font-semibold text-sm w-full"
            >
              <LogOut className="w-5 h-5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        <div
          className={`relative rounded-3xl p-6 sm:p-10 text-white mb-8 overflow-hidden shadow-2xl animate-[fadeUp_0.4s_ease-out_both] ${tr}`}
          style={{ backgroundColor: C.hero }}
        >
          <div className="relative z-10">
            <p className="text-[#A8C8E8] text-xs sm:text-sm font-semibold mb-2 tracking-widest uppercase">
              منصة SMS التعليمية — قسم الحسابات
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 text-[#FFFAF3]">
              المدفوعات والاشتراكات 💳
            </h2>
            <p className="text-[#A8C8E8]/90 text-sm mb-4">
              تحقق من حالة اشتراكك وقم بتجديده بسهولة.
            </p>
          </div>
          <div className="absolute -left-16 -top-16 w-72 h-72 bg-[#A8C8E8] rounded-full opacity-10 pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#FFF2DB] rounded-full opacity-5 pointer-events-none" />
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 animate-[fadeUp_0.4s_ease-out_both]">
            <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: "#A8C8E8" }} />
            <p className="text-lg font-semibold" style={{ color: C.textM }}>جاري تحميل البيانات...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Payment Status Card */}
            <div className="rounded-2xl p-6 mb-6 animate-[fadeUp_0.45s_ease-out_both]" style={{ backgroundColor: C.card, border: `2px solid ${C.border}`, boxShadow: C.cardSh }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-extrabold" style={{ color: C.textP }}>حالة الاشتراك</h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold" style={{ backgroundColor: badge.bg, color: badge.col, border: `1.5px solid ${badge.border}` }}>
                  {badge.text}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-3 bg-black/5 rounded-xl p-3" style={{ backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.03)" }}>
                  <Calendar className="w-5 h-5" style={{ color: C.textM }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: C.textM }}>تاريخ الانتهاء</p>
                    <p className="text-sm font-bold" style={{ color: C.textP }}>{formatDate(paidUntil ??"")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-black/5 rounded-xl p-3" style={{ backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.03)" }}>
                  <CreditCard className="w-5 h-5" style={{ color: C.textM }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: C.textM }}>نوع الاشتراك</p>
                    <p className="text-sm font-bold" style={{ color: C.textP }}>شهري</p>
                  </div>
                </div>
              </div>

              {paymentStatus !== "paid" && paymentStatus !== "exempt" && (
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
                  style={{ backgroundColor: "#0A2947", color: "#A8C8E8" }}
                >
                  <CreditCard className="w-4 h-4" />
                  تجديد الاشتراك
                </button>
              )}
            </div>

            {/* Payment Form */}
            {showPaymentForm && (
              <div className="rounded-2xl p-6 mb-6 animate-[fadeUp_0.3s_ease-out_both]" style={{ backgroundColor: C.card, border: `2px solid ${C.border}`, boxShadow: C.cardSh }}>
                <h3 className="text-lg font-extrabold mb-4" style={{ color: C.textP }}>تجديد الاشتراك</h3>
                
                <div className="mb-4">
                  <label className="block text-xs font-semibold mb-2" style={{ color: C.textM }}>طريقة الدفع</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PAYMENT_METHODS.map(method => (
                      <div
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`p-4 rounded-xl cursor-pointer transition-all ${selectedMethod === method.id ? 'ring-2 ring-[#0A2947]' : ''}`}
                        style={{
                          backgroundColor: selectedMethod === method.id ? "rgba(10,41,71,0.1)" : C.input,
                          border: `2px solid ${selectedMethod === method.id ? "#0A2947" : C.border}`
                        }}
                      >
                        <div className="text-2xl mb-1">{method.icon}</div>
                        <p className="text-sm font-bold" style={{ color: C.textP }}>{method.label}</p>
                        <p className="text-xs" style={{ color: C.textS }}>{method.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold mb-2" style={{ color: C.textM }}>المبلغ</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {PAYMENT_AMOUNTS.map(item => (
                      <button
                        key={item.amount}
                        onClick={() => setSelectedAmount(item.amount)}
                        className={`p-3 rounded-xl font-bold text-sm transition-all ${selectedAmount === item.amount ? 'ring-2 ring-[#0A2947]' : ''}`}
                        style={{
                          backgroundColor: selectedAmount === item.amount ? "rgba(10,41,71,0.1)" : C.input,
                          border: `2px solid ${selectedAmount === item.amount ? "#0A2947" : C.border}`,
                          color: C.textP
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handlePayment}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60"
                    style={{ backgroundColor: "#16a34a", color: "#fff" }}
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {processing ? "جاري المعالجة..." : `دفع ${selectedAmount} ج.م`}
                  </button>
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    disabled={processing}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all"
                    style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#dc2626" }}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {paymentSuccess && (
              <div className="rounded-2xl p-4 mb-6 flex items-center gap-3 animate-[fadeUp_0.3s_ease-out_both]" style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "2px solid rgba(34,197,94,0.25)" }}>
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <p className="text-green-600 text-sm font-semibold">تم الدفع بنجاح! تم تجديد اشتراكك.</p>
              </div>
            )}

            {/* Payment History */}
            <div className="rounded-2xl p-6 animate-[fadeUp_0.5s_ease-out_both]" style={{ backgroundColor: C.card, border: `2px solid ${C.border}`, boxShadow: C.cardSh }}>
              <h3 className="text-lg font-extrabold mb-4" style={{ color: C.textP }}>سجل المدفوعات</h3>
              
              {paymentHistory.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: C.textM }} />
                  <p className="text-sm" style={{ color: C.textS }}>لا يوجد سجل مدفوعات</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentHistory.map((payment, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 rounded-xl"
                      style={{ backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.03)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(34,197,94,0.15)" }}>
                          <CheckCircle2 className="w-5 h-5" style={{ color: "#16a34a" }} />
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: C.textP }}>{payment.amount} ج.م</p>
                          <p className="text-xs" style={{ color: C.textM }}>{formatDate(payment.date)}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-semibold" style={{ color: C.textS }}>
                          {payment.method === "cash" ? "نقداً" : payment.method === "card" ? "بطاقة" : "تحويل بنكي"}
                        </p>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold mt-1" style={{ backgroundColor: "rgba(34,197,94,0.12)", color: "#16a34a" }}>
                          مكتمل
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
