"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchWithAuth } from "@/lib/api";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Plus, Briefcase, Users, Compass, Coffee, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

type Diary = {
  id: string;
  session_id: string;
  core_emotion: string;
  insight: string;
  created_at: string;
};

function DiaryCardItem({ diary, index, timeStr, diaryToDelete, handleDeleteDiary, router }: any) {
  const controls = useAnimation();

  // 若弹窗被取消（diaryToDelete 变回 null），且卡片原本处于划开状态，则将其自动恢复原位
  useEffect(() => {
    if (!diaryToDelete) {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    }
  }, [diaryToDelete, controls]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="relative pl-5 pr-0 mb-6 last:mb-2"
    >
      {/* 轴上的小圆点，精准对齐卡片内部的 Header（时间/标签） */}
      <div className="absolute -left-[5.5px] top-[29px] sm:top-[33px] w-[10px] h-[10px] rounded-full border-[2px] border-[#8CA48B]/60 bg-background z-20 transition-transform duration-300" />

      {/* 底层：删除按钮 (右侧隐藏) */}
      <div className="absolute right-0 top-0 bottom-0 w-[80px] flex items-center justify-end pr-3">
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDeleteDiary(e as any, diary.id);
          }}
          className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center transition-colors active:bg-red-100 z-0 shadow-sm"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* 表层：支持拖拽的卡片 */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        animate={controls}
        onDragEnd={(event, info) => {
          if (info.offset.x > -40) {
            controls.start({ x: 0 });
          } else {
            controls.start({ x: -80 });
          }
        }}
        className="relative z-10 block bg-white p-5 sm:p-6 rounded-[20px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] transition-shadow duration-300 border border-sage-light/10 cursor-pointer"
        onClick={(e) => {
          const style = window.getComputedStyle(e.currentTarget);
          const matrix = new DOMMatrixReadOnly(style.transform);
          if (matrix.m41 < -5) return;
          router.push(`/diary/${diary.id}`);
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <span className="text-sage-muted text-[14px] font-medium tracking-wide">
            {timeStr}
          </span>
          <span className="bg-[#F0F4F0] text-[#6F826E] text-[12px] px-3.5 py-1.5 rounded-full font-medium tracking-wider">
            {diary.core_emotion}
          </span>
        </div>
        <p className="text-sage-dark/90 text-[17px] font-medium leading-relaxed transition-colors line-clamp-4">
          {diary.title}
        </p>
      </motion.div>
    </motion.div>
  );
}

export default function HistoryPage() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  const loadDiaries = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
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
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    loadDiaries();

    const handleRefresh = () => {
      // 收到后台成功生成的消息后，静默拉取
      loadDiaries(true).then(() => {
        // 自动展开今天
        const todayStr = new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" });
        setExpandedDays(prev => {
          const next = new Set(prev);
          next.add(todayStr);
          return next;
        });
      });
    };

    window.addEventListener("refresh_diaries", handleRefresh);
    return () => window.removeEventListener("refresh_diaries", handleRefresh);
  }, []);

  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [isExpandedInit, setIsExpandedInit] = useState(false);

  const groupedDiariesEntries = useMemo(() => {
    const groups = diaries.reduce((acc, diary) => {
      // Parse UTC date correctly for local timezone rendering
      const date = new Date(diary.created_at + "Z");
      // Use local YYYY-MM-DD as the grouping key
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${day}`;
      
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(diary);
      return acc;
    }, {} as Record<string, Diary[]>);

    // Sort groups descending by dateKey
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [diaries]);

  useEffect(() => {
    if (groupedDiariesEntries.length > 0 && !isExpandedInit) {
      const initialExpanded = new Set<string>();
      // 默认展开最近的 3 天
      groupedDiariesEntries.slice(0, 3).forEach(([dateKey]) => {
        initialExpanded.add(dateKey);
      });
      setExpandedDays(initialExpanded);
      setIsExpandedInit(true);
    }
  }, [groupedDiariesEntries, isExpandedInit]);

  const toggleDay = (dateKey: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });
  };

  const [diaryToDelete, setDiaryToDelete] = useState<string | null>(null);

  const handleDeleteDiary = (e: React.MouseEvent, diaryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDiaryToDelete(diaryId);
  };

  const confirmDeleteDiary = async () => {
    if (!diaryToDelete) return;
    try {
      const sessionId = Cookies.get("guest_session_id");
      const res = await fetchWithAuth(`/api/v1/diaries/${diaryToDelete}?session_id=${sessionId}`, { method: "DELETE" });
      if (res.ok) {
        setDiaries(prev => prev.filter(d => d.id !== diaryToDelete));
      } else {
        console.error("Delete failed", await res.text());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDiaryToDelete(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <main id="home-scroll-container" className="flex-1 w-full flex flex-col items-center bg-background p-4 pt-[80px] font-sans relative overflow-x-hidden">
      {/* 极微弱的背景光晕 */}
      <div className="absolute top-0 left-0 w-full h-[30vh] bg-gradient-to-b from-sage-light/40 to-transparent -z-10" />

      <div className={`w-full max-w-3xl ${diaries.length > 0 ? 'mb-32' : 'mb-0'}`}>
        {!user && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-sage-light/30 border border-sage-light text-sage-dark px-4 py-3 rounded-2xl mb-6 text-sm text-center shadow-sm"
          >
            当前为匿名模式，数据仅存本地，<button onClick={() => router.push('/register')} className="font-semibold underline decoration-sage-primary/30 underline-offset-4">注册</button>以永久云端保存你的心境轨迹。
          </motion.div>
        )}

        {!loading && diaries.length > 0 && (
          <div className="mb-8 pl-2">
            <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[28px] sm:text-[32px] font-medium text-sage-dark tracking-wide mb-2">
              时光足迹
            </motion.h1>
            <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="text-sage-muted text-[13px] sm:text-[15px] tracking-widest">
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
            {groupedDiariesEntries.map(([dateKey, dayDiaries]) => {
              const isExpanded = expandedDays.has(dateKey);
              
              // Parse for display
              const dateObj = new Date(dateKey);
              const dayStr = String(dateObj.getDate()).padStart(2, "0"); // "03"
              // Remove the '月' text for manual layout, or keep it depending on format
              const monthStr = dateObj.toLocaleDateString("zh-CN", { month: "short" }); // e.g. "7月"
              let weekdayStr = dateObj.toLocaleDateString("zh-CN", { weekday: "short" }); // e.g. "周五"
              if (weekdayStr.startsWith("星期")) weekdayStr = weekdayStr.replace("星期", "周");

              return (
              <div key={dateKey} className="relative">
                {/* 日期头部设计还原 */}
                <motion.div variants={itemVariants}>
                  <button 
                    onClick={() => toggleDay(dateKey)}
                    className="w-full flex items-center justify-between py-6 px-2 group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      {/* 超大细体字体的日期 */}
                      <span className="text-[44px] font-light text-[#6F826E] tracking-tighter leading-none group-hover:text-sage-dark transition-colors">
                        {dayStr}
                      </span>
                      {/* 上下堆叠的月份与星期 */}
                      <div className="flex flex-col items-start justify-center gap-0.5 mt-1">
                        <span className="text-[15px] font-medium text-sage-dark/80 leading-none">{monthStr}</span>
                        <span className="text-[13px] text-sage-muted/80 leading-none tracking-wider">{weekdayStr}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-sage-muted/70 tracking-widest">{dayDiaries.length} 篇</span>
                      <ChevronRight size={18} className={`text-sage-muted/60 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </button>
                </motion.div>
                
                {/* 日记卡片时间轴 */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      {/* 局部的虚线/细线时间轴 */}
                      <div className="relative ml-[22px] border-l-[1.5px] border-sage-light/40 pb-6 pt-2">
                        {dayDiaries.map((diary, index) => {
                          const diaryDate = new Date(diary.created_at + "Z");
                          const timeStr = diaryDate.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
                          
                          return (
                            <DiaryCardItem
                              key={diary.id}
                              diary={diary}
                              index={index}
                              timeStr={timeStr}
                              diaryToDelete={diaryToDelete}
                              handleDeleteDiary={handleDeleteDiary}
                              router={router}
                            />
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* 底部柔和的分隔线，不贴边 */}
                <div className="w-[calc(100%-16px)] mx-auto h-[1px] bg-sage-light/20 mt-2" />
              </div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* FAB - 悬浮添加按钮 (居中胶囊设计) */}
      {!loading && diaries.length > 0 && (
        <div className="fixed bottom-10 left-0 w-full flex justify-center z-50 pointer-events-none">
          <Link href="/chat" className="pointer-events-auto">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.2 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="bg-[#8CA48B] text-white px-8 py-3.5 rounded-full shadow-lg shadow-[#8CA48B]/30 flex items-center justify-center gap-2 cursor-pointer hover:bg-[#7a9179] transition-colors"
            >
              <Plus size={20} strokeWidth={2.5} />
              <span className="text-[16px] font-medium tracking-widest pl-1">记录</span>
            </motion.div>
          </Link>
        </div>
      )}

      <ConfirmModal
        isOpen={!!diaryToDelete}
        title="告别这篇日记？"
        description="删除这篇日记将同时物理销毁它背后的所有原始对话记忆，且该操作不可恢复。"
        confirmText="彻底删除"
        onConfirm={confirmDeleteDiary}
        onCancel={() => setDiaryToDelete(null)}
      />
    </main>
  );
}
