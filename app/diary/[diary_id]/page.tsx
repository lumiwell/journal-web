"use client";

import { use, useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import Cookies from "js-cookie";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function DiarySnapshotPage({ params }: { params: Promise<{ diary_id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  
  const [diary, setDiary] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const fetchDiaryAndMessages = async () => {
      try {
        const sessionId = Cookies.get("guest_session_id");
        if (!sessionId) throw new Error("No session ID");

        // 1. Fetch Diary Metadata
        const diaryRes = await fetchWithAuth(`/api/v1/diaries/${unwrappedParams.diary_id}?session_id=${sessionId}`);
        if (!diaryRes.ok) throw new Error("Diary not found");
        const diaryData = await diaryRes.json();
        setDiary(diaryData);

        // 2. Fetch Diary Messages
        const msgRes = await fetchWithAuth(`/api/v1/diaries/${unwrappedParams.diary_id}/messages?session_id=${sessionId}`);
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          setMessages(msgData);
        }
      } catch (err) {
        console.error("Failed to load diary details", err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDiaryAndMessages();
  }, [unwrappedParams.diary_id]);

  if (loading) {
    return (
      <main className="flex-1 w-full flex flex-col items-center bg-background p-4 pt-[90px] font-sans h-full">
        <div className="flex gap-2 mt-20">
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-2 h-2 rounded-full bg-sage-primary"></motion.div>
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 rounded-full bg-sage-primary"></motion.div>
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 rounded-full bg-sage-primary"></motion.div>
        </div>
      </main>
    );
  }

  if (loadError || !diary) {
    return (
      <main className="flex-1 w-full flex flex-col items-center bg-background p-4 pt-[90px] font-sans h-full">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-20 flex flex-col items-center gap-6 bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-sm border border-red-50/50">
          <p className="text-xl font-medium text-sage-dark tracking-wide">日记不存在或无权访问</p>
          <button onClick={() => router.push("/")} className="px-8 py-3 bg-sage-primary text-white rounded-full hover:bg-sage-dark transition-all duration-300 text-sm font-medium shadow-sm">
            返回时光足迹
          </button>
        </motion.div>
      </main>
    );
  }

  // Format Date
  const dateObj = new Date(diary.created_at + 'Z');
  const dateStr = dateObj.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <main className="flex-1 w-full flex flex-col items-center bg-background p-4 pt-[90px] font-sans relative overflow-x-hidden overflow-y-auto">
      {/* 极微弱的背景光晕 */}
      <div className="absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-b from-sage-light/40 to-transparent -z-10" />

      <div className="w-full max-w-2xl flex flex-col mb-12">
        <Link href="/" className="self-start mb-6 text-sage-muted hover:text-sage-primary transition-colors text-sm flex items-center gap-2 group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> 返回时光
        </Link>

        {/* ========================================= */}
        {/* Top Section: The Crystal (日记结晶) */}
        {/* ========================================= */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-sm border border-sage-light/50 p-8 sm:p-12 relative overflow-hidden"
        >
          {/* 装饰性引言角标 */}
          <div className="absolute top-0 left-0 w-2 h-full bg-sage-primary/40 rounded-l-3xl"></div>
          
          <div className="flex justify-between items-start mb-8">
            <span className="text-xs font-medium tracking-widest text-sage-muted uppercase">
              {dateStr}
            </span>
            <span className="px-3 py-1 bg-sage-light/50 text-sage-dark text-xs rounded-full font-medium border border-sage-light">
              情绪状态：{diary.core_emotion}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-medium text-sage-dark leading-snug mb-8 tracking-wide">
            “{diary.insight}”
          </h1>

          <div className="text-base sm:text-lg text-sage-dark/80 leading-loose tracking-wide whitespace-pre-wrap">
            {diary.content || "一段关于觉察的旅程..."}
          </div>
        </motion.div>

        {/* ========================================= */}
        {/* Divider: The Journey (觉察足迹) */}
        {/* ========================================= */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.5, duration: 0.8 }} 
          className="flex items-center justify-center my-12"
        >
          <div className="border-t border-sage-light/80 flex-grow max-w-[100px]"></div>
          <span className="mx-6 text-xs text-sage-muted tracking-[0.2em]">对话回溯</span>
          <div className="border-t border-sage-light/80 flex-grow max-w-[100px]"></div>
        </motion.div>

        {/* ========================================= */}
        {/* Bottom Section: The Journey Chat Log */}
        {/* ========================================= */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.7, duration: 0.8 }} 
          className="space-y-6"
        >
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            
            return (
              <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div 
                  className={`max-w-[85%] p-4 text-[14px] leading-relaxed ${
                    isUser 
                      ? "bg-sage-light/40 text-sage-dark rounded-3xl rounded-br-md border border-sage-light/20" 
                      : "bg-transparent text-sage-dark/80 rounded-3xl px-2"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}
        </motion.div>
        
      </div>
    </main>
  );
}
