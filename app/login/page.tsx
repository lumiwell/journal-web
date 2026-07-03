"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import { fetchWithAuth } from "@/lib/api";

export default function LoginPage({ customTitle, customSubtitle }: { customTitle?: string, customSubtitle?: string }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const title = customTitle || "回到我的时间线";
  const subtitle = customSubtitle || "为漂泊的思绪，安一个永远的家";

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetchWithAuth("/api/v1/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMessage = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
        throw new Error(errorMessage || "发送验证码失败，请重试");
      }

      setStep(2);
    } catch (err: any) {
      setError(err.message);
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

      const { access_token, session_id } = await response.json();
      Cookies.set("auth_token", access_token, { expires: 7 }); // 7 days
      
      // Update the guest_session_id cookie so the frontend points to the merged main timeline
      if (session_id) {
        Cookies.set("guest_session_id", session_id, { expires: 365, path: "/" });
      }

      // Hard refresh to reload layout and fetch user
      const returnTo = new URLSearchParams(window.location.search).get("returnTo") || "/";
      window.location.href = returnTo;
    } catch (err: any) {
      setError(err.message);
    } finally {
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || (step === 1 ? !email : code.length !== 6)}
                className="group relative flex w-full justify-center rounded-2xl border border-transparent bg-sage-primary py-3.5 px-4 text-[15px] font-medium tracking-wide text-white hover:bg-sage-dark focus:outline-none focus:ring-2 focus:ring-sage-primary focus:ring-offset-2 disabled:opacity-50 transition-all shadow-sm"
              >
                {loading ? "处理中..." : step === 1 ? "获取验证码" : "认证身份"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
