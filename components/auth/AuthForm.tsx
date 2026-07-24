"use client";

import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { Turnstile } from "@marsidev/react-turnstile";
import { fetchWithAuth } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";

interface AuthFormProps {
  title?: string;
  subtitle?: string;
}

export default function AuthForm({ title = "欢迎使用觉察", subtitle = "输入邮箱，开始或继续你的日记练习" }: AuthFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<boolean>(false);
  const turnstileRef = useRef<any>(null);
  
  useEffect(() => {
    const savedEmail = sessionStorage.getItem("auth_email");
    if (savedEmail) setEmail(savedEmail);
    const savedAgreed = sessionStorage.getItem("auth_agreed");
    if (savedAgreed === "true") setAgreedToPrivacy(true);
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    sessionStorage.setItem("auth_email", email);
  }, [email, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    sessionStorage.setItem("auth_agreed", agreedToPrivacy.toString());
  }, [agreedToPrivacy, isMounted]);
  
  const router = useRouter();
  const { refreshUser } = useAuth();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (!turnstileToken) {
      if (turnstileError) {
        setError("人机验证加载失败，请刷新页面重试");
      } else {
        setError("正在进行安全验证，请稍候再试...");
      }
      setLoading(false);
      return;
    }

    try {
      const response = await fetchWithAuth("/api/v1/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ email, turnstile_token: turnstileToken }),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMessage = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
        throw new Error(errorMessage || "发送验证码失败，请重试");
      }

      setStep(2);
    } catch (err: any) {
      setError(err.message);
      turnstileRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const guest_session_id = Cookies.get("guest_session_id");

    try {
      const response = await fetchWithAuth("/api/v1/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          email,
          code,
          guest_session_id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMessage = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
        throw new Error(errorMessage || "验证码无效或已过期");
      }

      const { access_token, session_id, is_new_user } = await response.json();
      Cookies.set("auth_token", access_token, { expires: 7 }); // 7 days
      
      // Update the guest_session_id cookie so the frontend points to the merged main timeline
      if (session_id) {
        Cookies.set("guest_session_id", session_id, { expires: 365, path: "/" });
      }
      
      // PostHog Tracking
      import('posthog-js').then((posthogModule) => {
        const posthog = posthogModule.default;
        if (posthog) {
          if (is_new_user) {
            posthog.capture('signup_success');
          } else {
            posthog.capture('login_success');
          }
        }
      });
      
      // 清空本地暂存的注册表单数据
      sessionStorage.removeItem("auth_email");
      sessionStorage.removeItem("auth_agreed");

      await refreshUser();
      
      setShowToast(true);
      
      setTimeout(() => {
        const returnTo = new URLSearchParams(window.location.search).get("returnTo") || "/chat";
        const suffix = is_new_user ? (returnTo.includes("?") ? "&new_user=true" : "?new_user=true") : "";
        router.push(returnTo + suffix);
      }, 500);
      
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden min-h-[80vh]">
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-sage-light/40 to-transparent -z-10" />
      
      <div className="w-full max-w-md space-y-8 bg-white/60 backdrop-blur-2xl p-10 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 relative">
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-sage-light/50 rounded-full blur-2xl opacity-50 pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-sage-light/30 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        
        <div className="relative z-10">
          <h2 className="text-center text-2xl sm:text-3xl font-medium tracking-wider text-sage-dark mb-2">
            {title}
          </h2>
          <p className="text-center text-sage-muted text-sm tracking-wide mb-8">
            {subtitle}
          </p>
          
          <form className="space-y-6" onSubmit={step === 1 ? handleSendOTP : handleVerifyOTP}>
            {error && <div className="text-red-500 text-[13px] text-center bg-red-50/80 backdrop-blur-sm p-3 rounded-2xl border border-red-100">{error}</div>}
            
            <div className="space-y-5">
              {step === 1 ? (
                <div>
                  <input
                    type="email"
                    required
                    className="block w-full rounded-2xl border-0 bg-white/70 px-5 py-3.5 text-sage-dark placeholder-sage-muted focus:ring-2 focus:ring-sage-primary/50 transition-all text-[15px] shadow-sm outline-none"
                    placeholder="你的邮箱地址"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-[13px] text-sage-muted text-center tracking-wide">
                    验证码已发送至 {email}
                    <button type="button" onClick={() => setStep(1)} className="ml-2 text-sage-primary font-medium hover:underline">修改</button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    className="block w-full text-center tracking-[0.5em] rounded-2xl border-0 bg-white/70 px-5 py-3.5 text-sage-dark placeholder-sage-muted/50 focus:ring-2 focus:ring-sage-primary/50 transition-all text-xl shadow-sm font-mono outline-none"
                    placeholder="------"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 px-1">
              <input
                type="checkbox"
                id="privacy"
                checked={agreedToPrivacy}
                onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                className="mt-1 shrink-0 rounded border-gray-300 text-sage-primary focus:ring-sage-primary"
              />
              <label htmlFor="privacy" className="text-[12px] text-sage-muted leading-relaxed">
                我已阅读并同意
                <Link href="/terms-of-service" className="text-sage-primary hover:underline mx-0.5">
                  《服务条款》
                </Link>、
                <Link href="/privacy-policy" className="text-sage-primary hover:underline mx-0.5">
                  《隐私政策》
                </Link>及
                <Link href="/refund-policy" className="text-sage-primary hover:underline mx-0.5">
                  《退款政策》
                </Link>
                ，并同意系统记录、处理我的日记与情绪相关信息。
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !agreedToPrivacy || (step === 1 ? !email : code.length !== 6)}
                className="group relative flex w-full justify-center rounded-2xl border border-transparent bg-sage-primary py-3.5 px-4 text-[15px] font-medium tracking-wide text-white hover:bg-sage-dark focus:outline-none focus:ring-2 focus:ring-sage-primary focus:ring-offset-2 disabled:opacity-50 transition-all shadow-sm"
              >
                {loading ? "处理中..." : step === 1 ? "获取验证码" : "认证身份"}
              </button>
              
              {step === 1 && (
                <Turnstile
                  ref={turnstileRef}
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string}
                  onSuccess={(token) => {
                    setTurnstileToken(token);
                    setTurnstileError(false);
                  }}
                  onError={() => {
                    setTurnstileError(true);
                  }}
                  onExpire={() => {
                    setTurnstileToken(null);
                  }}
                  options={{ size: "invisible" }}
                />
              )}
            </div>
          </form>
        </div>
      </div>

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-3 bg-white/95 backdrop-blur-xl px-6 py-3.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-sage-light/40"
          >
            <div className="w-6 h-6 rounded-full bg-sage-primary flex items-center justify-center text-white shrink-0">
              <Check size={14} strokeWidth={3} />
            </div>
            <span className="text-[15px] font-medium text-sage-dark tracking-wide">欢迎回来，数据已同步</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
