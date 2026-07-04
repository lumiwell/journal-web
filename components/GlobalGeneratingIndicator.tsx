"use client";

import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function GlobalGeneratingIndicator() {
  const { isExtractingDiary } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // 监听全局刷新事件以触发成功状态
    const handleSuccess = () => {
      // 只有之前确实在生成，现在收到成功事件，才展示成功提示
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    };

    window.addEventListener("refresh_diaries", handleSuccess);
    return () => {
      window.removeEventListener("refresh_diaries", handleSuccess);
    };
  }, []);

  // 当生成状态变为 true 时，确保清除可能残留的成功状态
  useEffect(() => {
    if (isExtractingDiary) {
      setShowSuccess(false);
    }
  }, [isExtractingDiary]);

  return (
    <AnimatePresence>
      {/* 生成中状态 */}
      {isExtractingDiary && (
        <motion.div
          key="generating"
          initial={{ opacity: 0, y: "-50%", scale: 0.9, x: "-50%" }}
          animate={{ opacity: 1, y: "-50%", scale: 1, x: "-50%" }}
          exit={{ opacity: 0, y: "-50%", scale: 0.9, x: "-50%" }}
          className="absolute top-1/2 left-1/2 z-[100] flex items-center gap-2 bg-rose-50/80 backdrop-blur-sm px-3 py-1 rounded-full border border-rose-100/50 pointer-events-none"
        >
          <div className="flex gap-[3px] items-center">
            <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-1 h-1 rounded-full bg-rose-400"></motion.div>
            <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="w-1 h-1 rounded-full bg-rose-400"></motion.div>
            <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="w-1 h-1 rounded-full bg-rose-400"></motion.div>
          </div>
          <span className="text-[11px] text-rose-500 font-medium tracking-wider">正在生成日记...</span>
        </motion.div>
      )}

      {/* 成功状态 */}
      {showSuccess && !isExtractingDiary && (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: "-50%", scale: 0.9, x: "-50%" }}
          animate={{ opacity: 1, y: "-50%", scale: 1, x: "-50%" }}
          exit={{ opacity: 0, y: "-50%", scale: 0.9, x: "-50%" }}
          className="absolute top-1/2 left-1/2 z-[100] flex items-center gap-1.5 bg-emerald-50/80 backdrop-blur-sm px-3 py-1 rounded-full border border-emerald-100/50 pointer-events-none"
        >
          <CheckCircle2 size={12} className="text-emerald-500" />
          <span className="text-[11px] text-emerald-600 font-medium tracking-wider">日记已封存</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
