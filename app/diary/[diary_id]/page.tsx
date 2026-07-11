"use client";

import { use, useState } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2, ArrowRight } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ActionSheet from "@/components/ui/ActionSheet";
import { useDiaryData } from "@/hooks/useDiaryData";
import { EditableBlock } from "@/components/ui/EditableBlock";
import { EditableTagsBlock, getTagStyles } from "@/components/diary/EditableTagsBlock";

export default function DiarySnapshotPage({ params }: { params: Promise<{ diary_id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  
  const {
    diary,
    messages,
    loading,
    loadError,
    updateDiaryField,
    toggleActionStatus,
    executeDelete,
    checkExploreConflict,
    forceClearChat
  } = useDiaryData(unwrappedParams.diary_id);

  const [showRawChat, setShowRawChat] = useState(false);
  const [showFullNarrative, setShowFullNarrative] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showExploreModal, setShowExploreModal] = useState(false);
  const [isCheckingExplore, setIsCheckingExplore] = useState(false);

  const handleContinueExplore = async () => {
    setIsCheckingExplore(true);
    const hasConflict = await checkExploreConflict();
    setIsCheckingExplore(false);
    if (hasConflict) {
      setShowExploreModal(true);
    } else {
      router.push(`/chat?context_diary_id=${diary.id}`);
    }
  };

  const handleDeleteDiary = () => {
    setShowActionSheet(false);
    setShowConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    const success = await executeDelete();
    if (success) {
      router.replace("/");
    }
  };

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

  const dateStr = new Date(diary.created_at + 'Z').toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  const content = diary.content || {};

  return (
    <main className="flex-1 w-full flex flex-col items-center pt-0 font-sans relative overflow-x-hidden min-h-screen" style={{ backgroundColor: '#FAF9F6' }}>
      
      {/* 情绪治愈系背景光晕 (Ambient Background) - 静态以支持长截屏 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#E8EFE9]/60 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#FCEBE7]/50 blur-[120px]" />
        <div className="absolute top-[30%] right-[5%] w-[40vw] h-[40vw] rounded-full bg-[#FFF4E0]/40 blur-[100px]" />
      </div>

      {/* Navigation Bar (Absolute Top, scrolls with page) */}
      <div className="absolute top-0 left-0 right-0 pt-6 sm:pt-8 z-[100] pointer-events-none flex items-start justify-between px-6 sm:px-8">
        
        {/* Back Button (Subtle & Borderless) */}
        <Link 
          href="/" 
          className="w-11 h-11 flex items-center justify-center rounded-full text-sage-dark/50 hover:text-sage-dark transition-all duration-300 pointer-events-auto hover:bg-white/30 hover:scale-105"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>

        {/* More Options Button (Subtle & Borderless) */}
        <button 
          onClick={() => setShowActionSheet(true)}
          className="w-11 h-11 flex items-center justify-center rounded-full text-sage-dark/50 hover:text-sage-dark transition-all duration-300 pointer-events-auto hover:bg-white/30"
        >
          <MoreHorizontal size={24} strokeWidth={2.5} />
        </button>

      </div>

      {/* --- Coping Mantra Banner (Edge-to-Edge) --- */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="w-full relative overflow-hidden z-10 flex flex-col justify-start min-h-[220px] sm:min-h-[260px] pt-14 sm:pt-16 pb-20 shrink-0">
        {/* Banner Background & Decorations with smooth fade out at the bottom */}
        <div className="absolute inset-0 pointer-events-none z-0" style={{ maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)' }}>
          {/* Distinct Banner Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#d2e0d7] via-[#f0d8d1] to-[#f4e8d3]" />
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/50 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/40 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4" />
        </div>

        
        <div className="relative w-full max-w-2xl mx-auto px-6 sm:px-12 flex flex-col items-center text-center z-20">
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="text-xs tracking-[0.4em] text-sage-dark/50 uppercase mb-2 font-bold flex items-center gap-3">
              <span className="w-8 h-[1px] bg-sage-dark/15"></span>
              今日防身咒语
              <span className="w-8 h-[1px] bg-sage-dark/15"></span>
            </motion.span>
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }} className="text-[10px] text-sage-dark/40 tracking-widest opacity-80">
              下次emo了，回来看看这句话
            </motion.span>
          </div>
          <div className="w-full max-w-lg">
            <EditableBlock 
              multiline={true}
              content={content.coping_mantra} 
              onSave={(val) => updateDiaryField('coping_mantra', val)} 
              textClassName="text-sage-dark font-medium italic text-xl sm:text-2xl tracking-widest text-center leading-relaxed drop-shadow-sm"
              placeholder="写下一句保护自己的力量咒语..."
            />
          </div>
        </div>
      </motion.div>

      <div className="w-full max-w-2xl flex flex-col px-6 sm:px-12 py-10 mb-8 gap-8 z-10 shrink-0">

        {/* --- Header Block --- */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full flex flex-col gap-3">
          <EditableBlock 
            multiline={false} 
            content={diary.title} 
            onSave={(val) => updateDiaryField('title', val)} 
            textClassName="text-3xl sm:text-4xl font-bold tracking-tight text-sage-dark"
            placeholder="写下今天的标题..."
          />
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium tracking-widest text-sage-muted uppercase">{dateStr}</span>
            <div className={`px-1 py-0.5 rounded-full font-medium border flex items-center justify-center transition-colors ${getTagStyles(diary.core_emotion, 'emotion', false).wrapper}`}>
              <EditableBlock 
                multiline={false} 
                content={diary.core_emotion} 
                onSave={(val) => updateDiaryField('core_emotion', val)} 
                textClassName="text-inherit text-xs font-medium px-2 py-0.5 min-w-[40px] text-center"
                placeholder="核心情绪"
              />
            </div>
          </div>
        </motion.div>

        {/* --- Emotions Block (延伸情绪) --- */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
          <div className="text-[11px] font-bold tracking-widest text-sage-muted/60 uppercase mb-2">延伸情绪</div>
          <EditableTagsBlock 
            type="emotion"
            emptyFallbackText="未觉察到其他情绪"
            tags={content.emotions || []} 
            onSave={(newTags) => updateDiaryField('emotions', newTags as any)} 
          />
        </motion.div>

        {/* --- SomaTags Block (身体感受) --- */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <div className="text-[11px] font-bold tracking-widest text-sage-muted/60 uppercase mb-2">身体感受</div>
          <EditableTagsBlock 
            type="neutral"
            emptyFallbackText="未觉察到明显身体感受"
            tags={content.body_sensation || []} 
            onSave={(newTags) => updateDiaryField('body_sensation', newTags as any)} 
          />
        </motion.div>

        {/* --- Fact Block --- */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-sage-dark/[0.02] rounded-xl p-4 border border-sage-dark/5">
          <EditableBlock 
            label="发生了什么" 
            content={content.fact} 
            onSave={(val) => updateDiaryField('fact', val)} 
            placeholder="我正在为什么事情焦虑？我害怕什么？"
          />
        </motion.div>

        {/* --- Insight Block --- */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="bg-sage-dark/[0.02] rounded-xl p-4 border border-sage-dark/5">
           <EditableBlock 
             label="觉察了什么" 
             content={content.insight} 
             onSave={(val) => updateDiaryField('insight', val)} 
             placeholder="我当下的情绪和身体反应是什么？"
           />
           {content.cognitive_distortion && content.cognitive_distortion.length > 0 && (
             <div className="mt-3 flex gap-2 items-center flex-wrap px-3">
               <span className="text-[11px] font-bold text-sage-muted/60 tracking-widest uppercase">认知偏差识别：</span>
               {content.cognitive_distortion.map((cd: string, i: number) => (
                 <span key={i} className="text-xs text-rose-500/80 bg-rose-50/50 px-2 py-1 rounded-md">{cd}</span>
               ))}
             </div>
           )}
        </motion.div>

        {/* --- Reframing Block --- */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="bg-sage-dark/[0.02] rounded-xl p-4 border border-sage-dark/5">
           <EditableBlock 
             label="你的好朋友对你说" 
             content={content.reframing} 
             onSave={(val) => updateDiaryField('reframing', val)} 
             placeholder="试着像朋友一样，安慰现在的自己"
           />
        </motion.div>

        {/* --- Action Block (微行动) --- */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="w-full">
          <div className={`relative overflow-hidden rounded-3xl p-8 sm:p-10 transition-all duration-700 ${
            content.action_plan?.status === 'completed' 
              ? 'bg-gradient-to-br from-sage-light/40 to-[#FCEBE7]/50 shadow-sm border border-white/60' 
              : 'bg-sage-dark/[0.02] border border-sage-dark/5 backdrop-blur-md'
          }`}>
            
            <AnimatePresence>
              {content.action_plan?.status === 'completed' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-10 -right-10 w-48 h-48 bg-white/60 rounded-full blur-2xl pointer-events-none"
                />
              )}
            </AnimatePresence>

            <div className="relative z-10 flex flex-col items-center text-center">
              <span className="text-[11px] font-bold tracking-widest text-sage-muted/70 uppercase mb-5">
                {content.action_plan?.status === 'completed' ? '🌸 勇气已封存' : '✦ 尝试给自己一份礼物 ✦'}
              </span>
              
              <div className="w-full max-w-md mb-8">
                {content.action_plan?.status === 'completed' ? (
                  <div className="text-center font-medium text-sage-primary text-lg sm:text-xl leading-loose whitespace-pre-wrap break-words px-3 py-2">
                    {content.action_plan?.task}
                  </div>
                ) : (
                  <EditableBlock 
                    multiline={true}
                    content={content.action_plan?.task} 
                    onSave={(val) => updateDiaryField('action_plan.task', val)} 
                    textClassName="text-center font-medium text-sage-dark text-base sm:text-lg"
                    placeholder="今天还可以为自己做些什么微小的事呢？"
                  />
                )}
              </div>

              <button 
                onClick={toggleActionStatus}
                className={`group relative overflow-hidden rounded-full px-8 py-3.5 transition-all duration-500 font-medium tracking-wide text-sm ${
                  content.action_plan?.status === 'completed'
                    ? 'bg-white/90 text-sage-primary shadow-sm hover:shadow hover:scale-105'
                    : 'bg-sage-dark/5 text-sage-dark hover:bg-sage-dark/10 hover:scale-105'
                }`}
              >
                {content.action_plan?.status === 'completed' ? (
                  <span className="flex items-center gap-2">
                    <span className="text-lg">✨</span> 已接纳这份勇敢
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="opacity-70 group-hover:opacity-100 transition-opacity">🌸</span> 我愿意为自己勇敢一次
                  </span>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* --- Narrative Module --- */}
        {content.narrative && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            className="w-full mt-8 max-w-2xl mx-auto"
          >
            <div className="bg-sage-dark/[0.015] border border-sage-dark/5 rounded-3xl p-6 sm:p-8 relative overflow-hidden transition-all duration-500">
              <h3 className="text-[12px] font-bold tracking-widest text-sage-muted/70 uppercase mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sage-primary/50"></span>
                深度觉察日记
              </h3>
              
              <div className={`prose prose-sm sm:prose-base prose-sage max-w-none transition-all duration-700 relative text-sage-dark/85 leading-relaxed ${
                showFullNarrative ? 'max-h-[5000px]' : 'max-h-[140px] overflow-hidden'
              }`}>
                <ReactMarkdown>{content.narrative}</ReactMarkdown>
                
                {!showFullNarrative && (
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none" />
                )}
              </div>

              {!showFullNarrative && (
                <div className="mt-2 flex justify-center relative z-10">
                  <button
                    onClick={() => setShowFullNarrative(true)}
                    className="text-[11px] tracking-widest text-sage-muted/60 hover:text-sage-primary/90 transition-colors"
                  >
                    展开阅读
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* --- Action Buttons (Explore / Raw Chat) --- */}
        <div className="flex flex-col items-center mt-4 mb-6 gap-8">
          <button 
            onClick={handleContinueExplore}
            disabled={isCheckingExplore}
            className="flex items-center gap-2 bg-sage-primary text-white px-8 py-3.5 rounded-full text-[15px] font-medium hover:bg-sage-dark transition-all duration-300 shadow-sm disabled:opacity-50"
          >
            基于本日记继续探索 <ArrowRight size={16} />
          </button>
          
          <button 
            onClick={() => setShowRawChat(!showRawChat)}
            className="text-[11px] text-sage-muted/40 hover:text-sage-primary/80 transition-colors tracking-widest flex items-center gap-2 px-6 py-2"
          >
            {showRawChat ? '收起对话' : '翻阅原始对话'}
          </button>
        </div>

        {/* --- Chat Log --- */}
        <AnimatePresence>
          {showRawChat && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="space-y-6 opacity-70 hover:opacity-100 transition-opacity duration-500 overflow-hidden"
            >
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] p-4 text-[14px] leading-relaxed whitespace-pre-wrap ${
                        isUser ? "bg-sage-light/40 text-sage-dark rounded-3xl rounded-br-md border border-sage-light/20" 
                               : "bg-transparent text-sage-dark/80 rounded-3xl px-2"
                      }`}>
                  {msg.content}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 底部操作半屏幕布 (Bottom Action Sheet) */}
      <ActionSheet isOpen={showActionSheet} onClose={() => setShowActionSheet(false)}>
        <div className="max-w-md mx-auto space-y-4">
          <button
            onClick={() => {
              setShowActionSheet(false);
              handleDeleteDiary();
            }}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-500 py-4 rounded-2xl text-[15px] font-medium hover:bg-red-100 transition-all duration-300 shadow-sm border border-red-100"
          >
            <Trash2 size={18} />
            删除这篇日记
          </button>

          <button
            onClick={() => setShowActionSheet(false)}
            className="w-full py-4 text-[15px] font-medium text-sage-muted hover:text-sage-dark transition-colors"
          >
            取消
          </button>
        </div>
      </ActionSheet>

      <ConfirmModal
        isOpen={showConfirm}
        onConfirm={handleDeleteConfirm}
        title="删除日记"
        description="这将会彻底销毁这篇日记及其背后的所有原始对话记录，该操作不可恢复。"
        confirmText="彻底删除"
        onCancel={() => setShowConfirm(false)}
      />

      {/* Explore Conflict Modal */}
      <AnimatePresence>
        {showExploreModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExploreModal(false)}
              className="fixed inset-0 z-[130] bg-sage-dark/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[140] w-[90%] max-w-[360px] bg-white/95 backdrop-blur-xl rounded-[28px] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-sage-light/30"
            >
              <h3 className="text-[17px] font-medium text-sage-dark text-center mb-3">当前有进行中的对话</h3>
              <p className="text-sage-dark/80 text-[14px] leading-relaxed text-center mb-8">
                您当前已经有一段未完成的对话。<br/><br/>
                请先前往对话页继续聊天，或将其生成为日记后，再来开启新的探索。
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push("/chat")}
                  className="w-full bg-sage-primary text-white py-3.5 rounded-2xl text-[15px] font-medium hover:bg-sage-dark transition-all duration-300 shadow-sm"
                >
                  前往对话页
                </button>
                <button
                  onClick={() => setShowExploreModal(false)}
                  className="w-full bg-transparent text-sage-muted py-3.5 rounded-2xl text-[14px] font-medium hover:bg-sage-dark/5 transition-all duration-300"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
