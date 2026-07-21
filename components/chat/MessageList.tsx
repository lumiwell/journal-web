import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface MessageListProps {
  messages: any[];
  status: string;
  contextDiaryTitle: string | null;
  emptyState: { title: string; subtitle: string };
  user: any;
  isLongIdleTime: boolean;
  hasUnprocessed: boolean;
  userMsgCount: number;
  canGenerate: boolean;
  isGenerating: boolean;
  isLoading: boolean;
  hasReachedAnonLimit: boolean;
  hasReachedTurnLimit: boolean;
  handleGenerateDiary: (isFromCurtain: boolean) => void;
}

export default function MessageList({
  messages,
  status,
  contextDiaryTitle,
  emptyState,
  user,
  isLongIdleTime,
  hasUnprocessed,
  userMsgCount,
  canGenerate,
  isGenerating,
  isLoading,
  hasReachedAnonLimit,
  hasReachedTurnLimit,
  handleGenerateDiary,
}: MessageListProps) {
  
  if (messages.length === 0) {
    return (
      <div className="text-center text-sage-muted h-full flex flex-col items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center">
          {contextDiaryTitle ? (
            <p className="text-lg text-sage-dark/80 mb-2">正在基于《{contextDiaryTitle}》继续探索</p>
          ) : (
            <p className="text-lg text-sage-dark/80 mb-2">{emptyState.title}</p>
          )}
          <p className="text-sm">{emptyState.subtitle}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {contextDiaryTitle && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex justify-center mb-6 mt-2">
          <div className="bg-sage-light/20 text-sage-dark/70 text-[13px] px-5 py-2.5 rounded-full text-center flex items-center justify-center gap-2">
            <Sparkles size={14} className="text-orange-500/80" />
            正在基于《{contextDiaryTitle}》继续探索
          </div>
        </motion.div>
      )}
      
      <AnimatePresence initial={false}>
        {messages.map((msg, index) => {
          const partsText = msg.parts && msg.parts.length > 0
            ? msg.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join("")
            : ((msg as any).content || "");
          const displayedText = partsText.replace(/[\s\u200B-\u200D\uFEFF]/g, "");
          
          if (msg.role === "assistant" && !displayedText) {
            if (status !== "submitted" && status !== "streaming") {
              return (
                <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                  <div className="flex items-center gap-2 text-red-500/70 px-1 py-4 text-[13px] tracking-wide">
                    ⚠️ 接收中止，未返回有效内容
                  </div>
                </motion.div>
              );
            }
            return (
              <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                <div className="flex items-center gap-2 text-sage-muted px-1 py-4 text-[15px] tracking-wide">
                  <span className="opacity-80 text-[13px]">倾听中</span>
                  <div className="flex gap-1.5 items-center">
                    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-1 h-1 rounded-full bg-sage-primary/80"></motion.div>
                    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="w-1 h-1 rounded-full bg-sage-primary/80"></motion.div>
                    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="w-1 h-1 rounded-full bg-sage-primary/80"></motion.div>
                  </div>
                </div>
              </motion.div>
            );
          }

          const isUser = msg.role === "user";
          const msgElement = (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.98 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              key={msg.id} 
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`max-w-[92%] sm:max-w-[85%] px-4 py-3 text-[15px] leading-relaxed ${
                  isUser 
                    ? "bg-sage-light text-sage-dark rounded-3xl rounded-br-md" 
                    : "bg-white text-sage-dark rounded-3xl rounded-bl-md shadow-sm border border-sage-light/30"
                }`}
              >
                {msg.parts && msg.parts.length > 0 ? (
                  msg.parts.map((part: any, partIdx: number) => {
                    if (part.type === "text") return <span key={partIdx} style={{ whiteSpace: "pre-wrap" }}>{part.text}</span>;
                    return null;
                  })
                ) : (
                  <span style={{ whiteSpace: "pre-wrap" }}>{(msg as any).content}</span>
                )}
              </div>
            </motion.div>
          );

          return msgElement;
        })}
      </AnimatePresence>

      {user && isLongIdleTime && hasUnprocessed && userMsgCount >= 10 && canGenerate && !isGenerating && !isLoading && !hasReachedAnonLimit && !hasReachedTurnLimit && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex justify-center my-6">
          <div className="bg-sage-light/20 text-sage-dark/70 text-[13px] px-6 py-3 rounded-2xl max-w-[85%] text-center leading-relaxed">
            距离上一次倾诉已经过去很久了。<br />
            你可以点击 <button onClick={() => handleGenerateDiary(true)} disabled={isGenerating || isLoading} className="text-sage-primary font-medium hover:underline inline-flex items-center gap-0.5 disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed align-bottom mx-0.5">
              生成日记
            </button> 开启新篇章，也可继续当前话题。
          </div>
        </motion.div>
      )}
      
      {hasReachedTurnLimit && status !== "streaming" && status !== "submitted" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex justify-center my-6">
          <div className="text-sage-dark/80 text-[14px] max-w-[85%] text-center leading-relaxed">
            你已经走得很深了，现在是时候收获了。<br />
            你可以点击 <button onClick={() => handleGenerateDiary(false)} disabled={isGenerating || isLoading} className="text-sage-primary font-medium hover:underline inline-flex items-center gap-0.5 disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed align-bottom mx-0.5">
              生成日记
            </button>。<br/>
            <span className="text-sage-dark/80 text-[13px] mt-1.5 inline-block">结晶为日记之后，你仍然可以基于日记继续对话与探索。</span>
          </div>
        </motion.div>
      )}

      {isLoading && messages[messages.length - 1]?.role === "user" && !hasReachedAnonLimit && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
          <div className="flex items-center gap-2 text-sage-muted px-1 py-4 text-[15px] tracking-wide">
            <span className="opacity-80 text-[13px]">倾听中</span>
            <div className="flex gap-1.5 items-center">
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-1 h-1 rounded-full bg-sage-primary/80"></motion.div>
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="w-1 h-1 rounded-full bg-sage-primary/80"></motion.div>
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="w-1 h-1 rounded-full bg-sage-primary/80"></motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
