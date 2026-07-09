"use client";

import { use, useEffect, useLayoutEffect, useState, useRef } from "react";
import { fetchWithAuth } from "@/lib/api";
import Cookies from "js-cookie";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2 } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

function EditableBlock({ 
  content, 
  onSave, 
  label,
  multiline = true,
  textClassName = "text-base sm:text-lg",
  placeholder = "点击添加..."
}: { 
  content: string; 
  onSave: (val: string) => void;
  label?: string;
  multiline?: boolean;
  textClassName?: string;
  placeholder?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(content);

  useEffect(() => {
    if (!isEditing) {
      setVal(content);
    }
  }, [content, isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (val !== content) {
      onSave(val);
    }
  };

  const containerClasses = `relative group w-full transition-colors duration-300`;

  return (
    <div className={containerClasses}>
      {label && (
        <div className="text-[11px] font-bold tracking-widest text-sage-muted/60 uppercase mb-1.5">
          {label}
        </div>
      )}
      
      <div className="relative w-full">
        {/* Hidden div to drive native height matching exactly */}
        <div className={`invisible whitespace-pre-wrap leading-relaxed ${textClassName} break-words`} aria-hidden="true">
          {(val || placeholder) + (val?.endsWith('\n') ? ' ' : '')}
        </div>
        {/* Absolute textarea overlay - Always present so clicks place cursor natively */}
        <textarea
          className={`absolute top-0 left-0 w-full h-full bg-transparent border-none outline-none ring-0 p-0 m-0 resize-none overflow-hidden text-sage-dark leading-relaxed whitespace-pre-wrap break-words ${textClassName} placeholder:text-sage-muted/40 placeholder:italic placeholder:font-normal`}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onFocus={() => setIsEditing(true)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setVal(content);
              e.currentTarget.blur();
            }
            if (!multiline && e.key === 'Enter') {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function EditableTag({ 
  initialValue, 
  onUpdate, 
  onRemove,
  onSplit,
  autoFocus = false,
  isEmptyFallback = false
}: { 
  initialValue: string; 
  onUpdate: (val: string) => void; 
  onRemove: () => void;
  onSplit?: (left: string, right: string) => void;
  autoFocus?: boolean;
  isEmptyFallback?: boolean;
}) {
  const [val, setVal] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  const handleBlur = () => {
    const trimmed = val.trim();
    if (!trimmed && !isEmptyFallback) {
      onRemove();
    } else if (trimmed !== initialValue) {
      onUpdate(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 忽略输入法正在组合输入（打中文拼音选词）时的按键事件
    if (e.nativeEvent.isComposing) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
    if (e.key === 'Escape') {
      setVal(initialValue);
      e.currentTarget.blur();
    }
    if (e.key === ' ' && onSplit) {
      e.preventDefault();
      const cursor = inputRef.current?.selectionStart || 0;
      const left = val.slice(0, cursor).trim();
      const right = val.slice(cursor).trim();
      
      // 绝对禁止在没有实质内容的情况下裂变（防止无限生成空标签）
      if (!left && !right) return;
      
      onSplit(left, right);
    }
  };

  const displayVal = val || (isEmptyFallback ? "未觉察到明显身体感受" : " ");

  return (
    <span className={`relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all group ${
      isEmptyFallback && !val 
        ? "bg-sage-dark/[0.015] text-sage-muted/70 border-sage-dark/[0.03] cursor-text" 
        : "bg-sage-dark/[0.03] text-sage-dark/85 border-sage-dark/5 hover:bg-sage-dark/[0.05]"
    }`}>
      <span className={`w-1 h-1 rounded-full shrink-0 ${isEmptyFallback && !val ? "bg-sage-muted/30" : "bg-sage-primary/50"}`} />
      <span className="relative inline-flex items-center min-w-[10px]">
        {/* Invisible span purely for width calculation */}
        <span className={`invisible whitespace-pre ${isEmptyFallback && !val ? 'italic text-[13px]' : ''}`} aria-hidden="true">
          {displayVal}
        </span>
        
        {/* Visible text layer when not editing (especially for placeholders) */}
        {isEmptyFallback && !val && (
          <span className="absolute inset-0 flex items-center text-[13px] italic pointer-events-none whitespace-nowrap">
            未觉察到明显身体感受
          </span>
        )}
        
        <input
          ref={inputRef}
          className={`absolute inset-0 w-full h-full bg-transparent border-none outline-none ring-0 p-0 m-0 text-sage-dark/85 text-[13px] ${isEmptyFallback && !val ? "opacity-0 focus:opacity-100" : ""}`}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      </span>
    </span>
  );
}

function EditableTagsBlock({ tags, onSave }: { tags: string[], onSave: (tags: string[]) => void }) {
  const [internalTags, setInternalTags] = useState(tags);
  const [autoFocusIdx, setAutoFocusIdx] = useState<number | null>(null);

  useEffect(() => {
    setInternalTags(prev => {
      const validParentTags = tags.filter(t => t.trim().length > 0).join(",");
      const validInternalTags = prev.filter(t => t.trim().length > 0).join(",");
      if (validParentTags !== validInternalTags) {
        return tags;
      }
      return prev;
    });
  }, [tags]);

  const updateTag = (index: number, newVal: string) => {
    const next = [...internalTags];
    next[index] = newVal;
    setInternalTags(next);
    onSave(next.filter(t => t.trim().length > 0));
  };

  const removeTag = (index: number) => {
    const next = [...internalTags];
    next.splice(index, 1);
    setInternalTags(next);
    onSave(next.filter(t => t.trim().length > 0));
  };

  const handleSplit = (index: number, left: string, right: string) => {
    const next = [...internalTags];
    next.splice(index, 1, left, right);
    setInternalTags(next);
    onSave(next.filter(t => t.trim().length > 0));
    
    if (!left && right) {
      setAutoFocusIdx(index);
    } else {
      setAutoFocusIdx(index + 1);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {internalTags.length > 0 ? (
        internalTags.map((tag, i) => (
          <EditableTag 
            key={`${tag}-${i}`} 
            initialValue={tag} 
            autoFocus={autoFocusIdx === i}
            onUpdate={(val) => updateTag(i, val)} 
            onRemove={() => removeTag(i)} 
            onSplit={(left, right) => handleSplit(i, left, right)}
          />
        ))
      ) : (
        <EditableTag 
          initialValue="" 
          isEmptyFallback={true}
          autoFocus={autoFocusIdx === 0}
          onUpdate={(val) => {
            const next = [val];
            setInternalTags(next);
            onSave(next.filter(t => t.trim().length > 0));
          }} 
          onRemove={() => {}} 
          onSplit={(left, right) => handleSplit(0, left, right)}
        />
      )}
    </div>
  );
}

export default function DiarySnapshotPage({ params }: { params: Promise<{ diary_id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  
  const [diary, setDiary] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showRawChat, setShowRawChat] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteDiary = () => {
    setShowActionSheet(false);
    setShowConfirm(true);
  };

  const executeDelete = async () => {
    try {
      const sessionId = Cookies.get("guest_session_id");
      const res = await fetchWithAuth(`/api/v1/diaries/${diary.id}?session_id=${sessionId}`, { method: "DELETE" });
      if (res.ok) {
        router.replace("/");
      } else {
        console.error("Delete failed", await res.text());
      }
    } catch (e) {
      console.error("Failed to delete diary", e);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchDiaryAndMessages = async () => {
      try {
        const sessionId = Cookies.get("guest_session_id");
        if (!sessionId) throw new Error("No session ID");

        const diaryRes = await fetchWithAuth(`/api/v1/diaries/${unwrappedParams.diary_id}?session_id=${sessionId}`);
        if (!diaryRes.ok) throw new Error("Diary not found");
        const diaryData = await diaryRes.json();
        
        // Handle old schema gracefully if content is a string
        if (typeof diaryData.content === 'string') {
           diaryData.content = { fact: diaryData.content };
        }

        setDiary(diaryData);

        const msgRes = await fetchWithAuth(`/api/v1/diaries/${unwrappedParams.diary_id}/messages?session_id=${sessionId}`);
        if (msgRes.ok) {
           setMessages(await msgRes.json());
        }
      } catch (err) {
        console.error("Failed to load diary", err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchDiaryAndMessages();
  }, [unwrappedParams.diary_id]);

  const updateDiaryField = async (fieldPath: string, newValue: string) => {
    if (!diary) return;
    
    // Deep copy
    const updated = { ...diary, content: { ...diary.content } };
    
    if (fieldPath === 'title') {
      updated.title = newValue;
    } else if (fieldPath === 'core_emotion') {
      updated.core_emotion = newValue;
    } else if (fieldPath === 'action_plan.task') {
      if (!updated.content.action_plan) updated.content.action_plan = { status: 'pending' };
      updated.content.action_plan.task = newValue;
    } else {
      updated.content[fieldPath] = newValue;
    }

    setDiary(updated); // Optimistic update

    try {
      const sessionId = Cookies.get("guest_session_id");
      await fetchWithAuth(`/api/v1/diaries/${diary.id}?session_id=${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updated.title,
          core_emotion: updated.core_emotion,
          content: updated.content
        })
      });
    } catch (e) {
      console.error("Failed to update", e);
    }
  };

  const toggleActionStatus = async () => {
    if (!diary || !diary.content?.action_plan) return;
    const currentStatus = diary.content.action_plan.status;
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    const updated = { ...diary, content: { ...diary.content, action_plan: { ...diary.content.action_plan, status: newStatus } } };
    setDiary(updated);

    try {
      const sessionId = Cookies.get("guest_session_id");
      await fetchWithAuth(`/api/v1/diaries/${diary.id}/action_status?session_id=${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      console.error("Failed to update status", e);
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
        {/* Distinct Banner Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#d2e0d7] via-[#f0d8d1] to-[#f4e8d3]" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/50 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/40 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        
        {/* Gradient fade to match page background at the bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#FAF9F6] to-transparent pointer-events-none" />


        
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
            <span className="px-3 py-1 bg-sage-light/50 text-sage-dark text-xs rounded-full font-medium border border-sage-light">
              {diary.core_emotion}
            </span>
          </div>
        </motion.div>

        {/* --- SomaTags Block (身体感受) --- */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <EditableTagsBlock 
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
             label="换个视角看看呗" 
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

        {/* --- Chat Log Reveal Button --- */}
        <div className="flex justify-center mt-8 mb-4">
          <button 
            onClick={() => setShowRawChat(!showRawChat)}
            className="text-[11px] text-sage-muted/40 hover:text-sage-primary/80 transition-colors tracking-widest flex items-center gap-2 px-6 py-3"
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
      <AnimatePresence>
        {showActionSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActionSheet(false)}
              className="fixed inset-0 z-[110] bg-sage-dark/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[120] bg-white/95 backdrop-blur-xl rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] border-t border-sage-light/30 p-6 pb-[max(2rem,env(safe-area-inset-bottom))]"
            >
              <div className="w-12 h-1.5 bg-sage-light/80 rounded-full mx-auto mb-8" />
              
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showConfirm}
        title="告别这篇日记？"
        description="这将会彻底销毁这篇日记及其背后的所有原始对话记录，该操作不可恢复。"
        confirmText="彻底删除"
        onConfirm={executeDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </main>
  );
}
