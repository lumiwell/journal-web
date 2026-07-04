"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchWithAuth } from "@/lib/api";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Briefcase, Users, Compass, Coffee, ChevronDown, ChevronRight } from "lucide-react";

type Diary = {
  id: string;
  session_id: string;
  core_emotion: string;
  insight: string;
  created_at: string;
};

export default function HistoryPage() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function loadDiaries() {
      try {
        const sessionId = Cookies.get("guest_session_id");
        if (!sessionId) return;
        
        const res = await fetchWithAuth(`/api/v1/diaries?session_id=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setDiaries(data);
        }
      } catch (err) {
        console.error("Failed to load diaries", err);
      } finally {
        setLoading(false);
      }
    }
    loadDiaries();
  }, []);

  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [isExpandedInit, setIsExpandedInit] = useState(false);

  const groupedDiariesEntries = useMemo(() => {
    const groups = diaries.reduce((acc, diary) => {
      const date = new Date(diary.created_at + "Z");
      const dateStr = date.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" });
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(diary);
      return acc;
    }, {} as Record<string, Diary[]>);
    return Object.entries(groups);
  }, [diaries]);

  useEffect(() => {
    if (groupedDiariesEntries.length > 0 && !isExpandedInit) {
      const initialExpanded = new Set<string>();
      // 默认展开最近的 3 天
      groupedDiariesEntries.slice(0, 3).forEach(([dateStr]) => {
        initialExpanded.add(dateStr);
      });
      setExpandedDays(initialExpanded);
      setIsExpandedInit(true);
    }
  }, [groupedDiariesEntries, isExpandedInit]);

  const toggleDay = (dateStr: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <main className="flex-1 w-full flex flex-col items-center bg-background p-4 pt-[70px] font-sans relative overflow-x-hidden overflow-y-auto">
      {/* 极微弱的背景光晕 */}
      <div className="absolute top-0 left-0 w-full h-[30vh] bg-gradient-to-b from-sage-light/40 to-transparent -z-10" />

      <div className={`w-full max-w-2xl mt-2 ${diaries.length > 0 ? 'mb-24' : 'mb-0'}`}>
        {!user && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-sage-light/30 border border-sage-light text-sage-dark px-4 py-3 rounded-2xl mb-8 text-sm text-center shadow-sm"
          >
            当前为匿名模式，数据仅存本地，<button onClick={() => router.push('/register')} className="font-semibold underline decoration-sage-primary/30 underline-offset-4">注册</button>以永久云端保存你的心境轨迹。
          </motion.div>
        )}

        {!loading && diaries.length > 0 && (
          <div className="mb-10">
            <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-3xl font-medium text-sage-dark tracking-wide mb-2">
              时光足迹
            </motion.h1>
            <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="text-sage-muted text-sm tracking-widest">
              无论好坏，都是你生命的一部分。
            </motion.p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <div className="flex gap-2 mt-4">
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-2.5 h-2.5 rounded-full bg-sage-primary/70"></motion.div>
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="w-2.5 h-2.5 rounded-full bg-sage-primary/70"></motion.div>
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="w-2.5 h-2.5 rounded-full bg-sage-primary/70"></motion.div>
             </div>
          </div>
        ) : diaries.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-10"
          >
            <h2 className="text-2xl font-medium text-sage-dark/90 mb-10 tracking-wide">今天感觉怎么样？</h2>
            
            <div className="grid grid-cols-2 gap-4 max-w-md w-full px-4">
              <button 
                onClick={() => router.push(`/chat?topic=工作焦虑&t=${Date.now()}`)} 
                className="flex flex-col items-center justify-center p-6 bg-amber-50/70 hover:bg-amber-100/70 text-sage-dark rounded-2xl shadow-sm hover:shadow border border-amber-200/50 transition-all group"
              >
                <Briefcase size={28} strokeWidth={1.5} className="mb-3 text-amber-700/70 group-hover:text-amber-700 group-hover:-translate-y-1 transition-all duration-300" />
                <span className="text-[15px] font-medium tracking-wide">工作焦虑</span>
              </button>
              
              <button 
                onClick={() => router.push(`/chat?topic=关系困扰&t=${Date.now()}`)} 
                className="flex flex-col items-center justify-center p-6 bg-rose-50/70 hover:bg-rose-100/70 text-sage-dark rounded-2xl shadow-sm hover:shadow border border-rose-200/50 transition-all group"
              >
                <Users size={28} strokeWidth={1.5} className="mb-3 text-rose-700/70 group-hover:text-rose-700 group-hover:-translate-y-1 transition-all duration-300" />
                <span className="text-[15px] font-medium tracking-wide">关系困扰</span>
              </button>
              
              <button 
                onClick={() => router.push(`/chat?topic=自我探索&t=${Date.now()}`)} 
                className="flex flex-col items-center justify-center p-6 bg-sky-50/70 hover:bg-sky-100/70 text-sage-dark rounded-2xl shadow-sm hover:shadow border border-sky-200/50 transition-all group"
              >
                <Compass size={28} strokeWidth={1.5} className="mb-3 text-sky-700/70 group-hover:text-sky-700 group-hover:-translate-y-1 transition-all duration-300" />
                <span className="text-[15px] font-medium tracking-wide">自我探索</span>
              </button>
              
              <button 
                onClick={() => router.push(`/chat`)} 
                className="flex flex-col items-center justify-center p-6 bg-sage-light/70 hover:bg-sage-light text-sage-dark rounded-2xl shadow-sm hover:shadow border border-sage-primary/30 transition-all group"
              >
                <Coffee size={28} strokeWidth={1.5} className="mb-3 text-sage-dark/70 group-hover:text-sage-dark group-hover:-translate-y-1 transition-all duration-300" />
                <span className="text-[15px] font-medium tracking-wide">随便聊聊</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="mt-6 pb-10"
          >

            {groupedDiariesEntries.map(([dateStr, dayDiaries]) => {
              const isExpanded = expandedDays.has(dateStr);
              return (
              <div key={dateStr} className="mb-8">
                {/* 日期头部，作为可点击的折叠开关 */}
                <motion.div variants={itemVariants}>
                  <button 
                    onClick={() => toggleDay(dateStr)}
                    className="flex items-center gap-3 w-full group text-left cursor-pointer"
                  >
                    <h3 className="text-[19px] sm:text-xl font-bold text-sage-dark tracking-wide group-hover:text-sage-primary transition-colors">
                      {dateStr}
                    </h3>
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-medium text-sage-dark/80 bg-sage-light/40 px-2.5 py-0.5 rounded-full">{dayDiaries.length} 篇</span>
                      {isExpanded ? <ChevronDown size={18} className="text-sage-dark/80" /> : <ChevronRight size={18} className="text-sage-dark/80" />}
                    </div>
                  </button>
                </motion.div>
                
                {/* 展开当天的日记列表，带有局部时光轴 */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="relative ml-[14px] sm:ml-[18px] border-l-2 border-sage-light/50 pl-5 sm:pl-7 mt-2 space-y-4 pt-1 pb-4">
                        {dayDiaries.map(diary => (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            key={diary.id} 
                            className="relative group"
                          >
                            {/* 局部时光轴的微小圆点指示器 */}
                            <div className="absolute -left-[26px] sm:-left-[34px] top-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full bg-background border-[2px] border-sage-primary/80 group-hover:scale-125 group-hover:bg-sage-primary transition-all duration-300"></div>

                            <Link 
                              href={`/diary/${diary.id}`} 
                              className="block bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-sm hover:shadow hover:bg-white transition-all duration-300 border border-sage-light/20"
                            >
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-sage-muted text-[13px] tracking-wider font-medium flex items-center gap-1.5">
                                  {new Date(diary.created_at + "Z").toLocaleString("zh-CN", { 
                                    hour: "2-digit", minute: "2-digit" 
                                  })}
                                </span>
                                <span className="bg-sage-light/40 text-sage-dark text-[11px] px-3 py-1 rounded-full font-medium tracking-wide border border-sage-light/30">
                                  {diary.core_emotion}
                                </span>
                              </div>
                              <p className="text-foreground text-[15px] font-medium leading-relaxed group-hover:text-sage-dark transition-colors line-clamp-3">
                                "{diary.insight}"
                              </p>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              );
            })}

          </motion.div>
        )}
      </div>

      {/* FAB - 悬浮添加按钮 (仅在有历史日记时显示) */}
      {!loading && diaries.length > 0 && (
        <Link href="/chat">
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-8 right-8 w-16 h-16 bg-sage-primary text-white rounded-full shadow-lg shadow-sage-primary/30 flex items-center justify-center cursor-pointer hover:bg-sage-dark transition-colors z-50 group"
          >
            <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:animate-ping transition-all"></div>
            <Plus size={28} className="relative z-10" />
          </motion.div>
        </Link>
      )}
    </main>
  );
}
