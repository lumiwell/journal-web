"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = Cookies.get("cookie_consent");
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    Cookies.set("cookie_consent", "true", { expires: 365 });
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl p-5 border border-sage-light/30 z-[100] flex flex-col sm:flex-row gap-4 items-center justify-between"
        >
          <div className="text-sm text-sage-dark leading-relaxed">
            我们使用 Cookie 来提升您的体验，并保护您的隐私数据安全。继续使用即表示您同意我们的{" "}
            <Link href="/privacy-policy" className="text-sage-primary hover:underline font-medium">
              隐私政策
            </Link>。
          </div>
          <button
            onClick={handleAccept}
            className="shrink-0 bg-sage-primary text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-sage-dark transition-colors"
          >
            我同意
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
