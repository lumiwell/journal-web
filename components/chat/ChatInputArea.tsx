import React, { useRef, useEffect } from 'react';
import { Send, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface ChatInputAreaProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  isGenerating: boolean;
  hasReachedAnonLimit: boolean;
  hasReachedTurnLimit: boolean;
  isApproachingAnonLimit: boolean;
  userMsgCount: number;
  setShowActionSheet: (show: boolean) => void;
}

export default function ChatInputArea({
  input,
  setInput,
  onSubmit,
  isLoading,
  isGenerating,
  hasReachedAnonLimit,
  hasReachedTurnLimit,
  isApproachingAnonLimit,
  userMsgCount,
  setShowActionSheet
}: ChatInputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // 把仅属于输入框的“高度自动伸缩”逻辑搬运到了这里！
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      
      if (scrollHeight > maxHeight) {
        textareaRef.current.style.overflowY = "auto";
      } else {
        textareaRef.current.style.overflowY = "hidden";
      }
    }
  }, [input]);

  // 控制回车键发送的逻辑，也跟着搬家了！
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading && !isGenerating) {
        const syntheticEvent = { preventDefault: () => {} } as React.SyntheticEvent<HTMLFormElement>;
        onSubmit(syntheticEvent); // 这里调用了父组件传进来的遥控器
      }
    }
  };

  return (
    <div className={`w-full px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/70 sm:bg-white/50 backdrop-blur-md transition-all duration-700`}>
      {(isApproachingAnonLimit || hasReachedAnonLimit) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto mb-2 text-center">
          <button 
            onClick={() => router.push('/register?returnTo=/chat')}
            className="inline-block bg-gradient-to-r from-sage-50 to-orange-50 text-sage-dark/80 px-4 py-1.5 rounded-full text-[13px] shadow-sm font-medium cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 transition-all"
          >
            {hasReachedAnonLimit ? (
              <><span className="text-orange-500 font-semibold underline decoration-orange-500/30 underline-offset-2">免费开始</span>，解锁更多且记录不丢失 ✨</>
            ) : (
              <>剩余 {10 - userMsgCount} 轮体验，<span className="text-orange-500 font-semibold underline decoration-orange-500/30 underline-offset-2">免费</span>解锁更多，记录不丢失 ✨</>
            )}
          </button>
        </motion.div>
      )}
      
      <form onSubmit={onSubmit} className="flex gap-2 items-end max-w-3xl mx-auto w-full relative">
        <div className="flex-1 bg-white rounded-[20px] shadow-sm border border-sage-light/50 py-1 px-2 relative overflow-hidden">
          {/* Highlight backdrop layer for text exceeding 1000 characters */}
          <div className="absolute inset-0 px-2 py-1.5 pointer-events-none text-[15px] leading-relaxed whitespace-pre-wrap break-words z-0" aria-hidden="true" style={{ color: 'transparent', height: textareaRef.current?.style.height }}>
            <span>{input.slice(0, 1000)}</span>
            <mark className="bg-orange-200/60 text-transparent">{input.slice(1000)}</mark>
          </div>
          <textarea
            ref={textareaRef}
            className={`w-full bg-transparent px-2 py-1.5 text-[15px] focus:outline-none placeholder-sage-muted text-sage-dark resize-none slim-scrollbar block leading-relaxed max-h-[120px] relative z-10 ${hasReachedAnonLimit || hasReachedTurnLimit ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ overflowY: 'auto' }}
            placeholder={hasReachedAnonLimit ? "体验已完成，点击上方气泡免费开始..." : hasReachedTurnLimit ? "对话已满载，请结晶为日记..." : "此刻你在想些什么？"}
            value={input}
            rows={1}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onFocus={() => {
              // 仅在 iOS 下执行滚动修复。Android Chrome 原生支持视口高度自适应，如果执行此代码反而会导致严重的位置错乱（大片空白）。
              const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
              if (isIOS) {
                setTimeout(() => {
                  window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
                  document.body.scrollTop = 0;
                  document.documentElement.scrollTop = 0;
                }, 10);
              }
            }}
            onKeyDown={handleKeyDown}
            disabled={hasReachedAnonLimit || hasReachedTurnLimit}
          />
        </div>
        
        {input.trim() ? (
          <button
            type="submit"
            disabled={isLoading || isGenerating || input.length > 1000 || hasReachedAnonLimit || hasReachedTurnLimit}
            onMouseDown={(e) => e.preventDefault()} // 防止点击发送按钮时抢走输入框的焦点
            className="bg-sage-primary text-white w-[38px] h-[38px] rounded-full hover:bg-sage-dark disabled:opacity-40 transition-colors flex items-center justify-center shrink-0 shadow-sm mb-0.5"
          >
            <Send size={16} className="-ml-0.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowActionSheet(true)}
            disabled={isGenerating || isLoading}
            className="bg-sage-light/40 text-sage-primary w-[38px] h-[38px] rounded-full hover:bg-sage-primary hover:text-white transition-all flex items-center justify-center shrink-0 shadow-sm mb-0.5"
          >
            <Plus size={20} />
          </button>
        )}
      </form>
      
      {input.length > 900 && !hasReachedAnonLimit && !hasReachedTurnLimit && (
        <div className={`text-right text-[12px] pr-12 pt-1 transition-colors ${input.length > 1000 ? 'text-red-500 font-medium' : 'text-orange-400'}`}>
          {input.length}/1000
        </div>
      )}
    </div>
  );
}
