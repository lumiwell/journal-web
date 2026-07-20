"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, CheckCircle2, ArrowRight } from "lucide-react";

export function openWaitlistModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("openWaitlistModal"));
  }
}

export default function WaitlistModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("openWaitlistModal", handleOpen);
    return () => window.removeEventListener("openWaitlistModal", handleOpen);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error("Submission failed");
      }

      setStatus("success");
      setEmail("");
      
      setTimeout(() => {
        setIsOpen(false);
        setStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("Error submitting email:", error);
      setStatus("error");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => setStatus("idle"), 300); // 恢复初始状态
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-sage-dark/20 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative overflow-hidden border border-sage-light/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              type="button"
              className="absolute top-4 right-4 p-2 text-sage-muted hover:text-sage-dark hover:bg-sage-50 rounded-full transition-colors z-[110]"
            >
            <X size={20} />
          </button>

          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-sage-primary/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-sage-primary/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">
            {status === "success" ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center py-6"
              >
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="text-green-500" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-sage-dark mb-2">已收到您的邮箱！</h3>
                <p className="text-sage-muted">
                  感谢您的支持。内测开启时，我们会第一时间给您发送邀请邮件，请留意查收。
                </p>
                <button
                  onClick={handleClose}
                  className="mt-8 px-8 py-3 bg-sage-50 text-sage-dark hover:bg-sage-100 rounded-full font-medium transition-colors"
                >
                  关闭窗口
                </button>
              </motion.div>
            ) : (
              <>
                <div className="w-16 h-16 bg-sage-50 rounded-full flex items-center justify-center mb-6">
                  <Mail className="text-sage-primary" size={28} />
                </div>
                <h3 className="text-2xl font-bold text-sage-dark mb-2">加入内测等待名单</h3>
                <p className="text-sage-muted mb-8 text-sm sm:text-base">
                  系统当前处于邀请制内测阶段。留下您的邮箱，成为第一批体验觉察的用户。
                </p>

                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="您的邮箱地址"
                      className="w-full px-5 py-3.5 bg-sage-50/50 border border-sage-light rounded-2xl focus:outline-none focus:ring-2 focus:ring-sage-primary/30 focus:border-sage-primary transition-all text-sage-dark placeholder:text-sage-muted/50"
                    />
                  </div>
                  {status === "error" && (
                    <p className="text-red-500 text-sm px-1">提交失败，请重试或检查您的网络连接。</p>
                  )}
                  <button
                    type="submit"
                    disabled={status === "loading" || !email}
                    className="w-full py-3.5 bg-sage-primary text-white rounded-2xl font-medium hover:bg-sage-dark transition-all shadow-md shadow-sage-primary/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {status === "loading" ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        提交申请 <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
