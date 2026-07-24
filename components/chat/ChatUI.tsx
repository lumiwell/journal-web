"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import GlobalGeneratingIndicator from "@/components/layout/GlobalGeneratingIndicator";
import ChatInputArea from "./ChatInputArea";
import MessageList from "./MessageList";
import { useDiaryGeneration } from "@/hooks/useDiaryGeneration";
import GeneratingOverlay from "./GeneratingOverlay";
import { Turnstile } from "@marsidev/react-turnstile";
import ChatActionSheet from "./ChatActionSheet";
import { useChatScroll } from "@/hooks/useChatScroll";
import { useChatSession } from "@/hooks/useChatSession";
import { usePostHog } from "posthog-js/react";

// ==========================================
// 🕒 情绪断代时间配置（方便本地测试）
// 测试时可以把这些值改成较短的时间，例如 1 * 60 * 1000 (1分钟)
// ==========================================
const IDLE_TIMEOUT_MS = 1 * 60 * 1000;         // 常规代谢：默认 6 小时 (测试环境 1 分钟)

export default function ChatUI({ sessionId, diaryId, topic, t, contextDiaryId, paymentId }: { sessionId: string, diaryId?: string, topic?: string, t?: string, contextDiaryId?: string, paymentId?: string }) {
  const [input, setInput] = useState("");
  const { user, refreshUser, isExtractingDiary: backgroundGenerating, setIsExtractingDiary: setBackgroundGenerating } = useAuth();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<boolean>(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const router = useRouter();
  
  // Active Sync mechanism for payments
  useEffect(() => {
    if (paymentId) {
      import('@/lib/api').then(({ fetchWithAuth }) => {
        fetchWithAuth("/api/v1/payments/verify", {
          method: "POST",
          body: JSON.stringify({ payment_id: paymentId })
        }).then(res => res.json()).then(data => {
          if (data.status === "succeeded") {
             // Refresh user quota to reflect newly added ink drops
             refreshUser();
             // Clean up the URL to prevent subsequent verifications on refresh
             const url = new URL(window.location.href);
             url.searchParams.delete('payment_id');
             window.history.replaceState({}, '', url.pathname + url.search);
          }
        }).catch(err => {
           console.error("Payment verification failed", err);
        });
      });
    }
  }, [paymentId, refreshUser]);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    isLoading,
    contextDiaryTitle,
    setContextDiaryTitle,
    activeContextDiaryId,
    setActiveContextDiaryId,
    messageDiaryMap,
    setMessageDiaryMap,
    isLongIdleTime,
    isInitializing,
    error,
  } = useChatSession(sessionId, backgroundGenerating, contextDiaryId);

  const userMsgCount = messages.filter(m => m.role === "user" && !messageDiaryMap[m.id]).length;
  const canGenerate = userMsgCount >= 2;
  const hasUnprocessed = userMsgCount > 0;

  // 这就是我们的新兵器：依赖注入式的 Hook！
  const { isGenerating, errorMsg, setErrorMsg, handleGenerateDiary } = useDiaryGeneration({
    sessionId, t, messages, setMessages, backgroundGenerating, setBackgroundGenerating,
    setActiveContextDiaryId, setContextDiaryTitle, canGenerate, IDLE_TIMEOUT_MS
  });

  // 监听底层的网络报错（比如 429 限流），并将其优雅地展示在顶部的红条中
  useEffect(() => {
    if (error) {
      try {
        const errorData = JSON.parse(error.message);
        if (errorData && errorData.detail) {
          setErrorMsg(errorData.detail);
        } else {
          setErrorMsg("请求过于频繁或网络波动，请稍后重试");
        }
      } catch (e) {
        // 如果后端返回的不是标准 JSON，直接显示文本
        // 优雅降级策略：如果报错是纯英文的底层网络错误（如 "Connection error."）或者超长日志，一律转为温和的中文提示
        const rawMsg = error.message || "";
        const hasChinese = /[\u4e00-\u9fa5]/.test(rawMsg);
        
        if (!hasChinese || rawMsg.length > 100 || rawMsg.includes("validation")) {
          setErrorMsg("服务端网络连接异常，请稍候重试");
        } else {
          // 如果是后端自定义的简短中文报错，则直接展示
          setErrorMsg(rawMsg || "网络请求失败，请重试");
        }
      }
    }
  }, [error, setErrorMsg]);

  const posthog = usePostHog();

  const handleGenerateDiaryWithQuotaCheck = (isFromCurtain: boolean) => {
    if (user !== null && user.quota < 1) {
      setErrorMsg("墨水已耗尽");
      return;
    }
    posthog?.capture('diary_generation_started', { isFromCurtain, messageCount: userMsgCount });
    handleGenerateDiary(isFromCurtain);
  };


  // 自动发送被缓冲的“第一条消息”
  useEffect(() => {
    if (turnstileToken && pendingMessage) {
      posthog?.capture('chat_message_sent', { isFirstMessage: true });
      sendMessage(
        { text: pendingMessage },
        { body: { 
            context_diary_id: activeContextDiaryId, 
            turnstile_token: turnstileToken,
            new_session: true
          } 
        }
      );
      setPendingMessage(null);
      setInput("");
      setErrorMsg("");
    }
  }, [turnstileToken, pendingMessage, sendMessage, activeContextDiaryId, setErrorMsg, posthog]);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading || input.length > 1000) return;
    
    // Turnstile check for new anonymous session
    if (!user && userMsgCount === 0 && !turnstileToken) {
      if (turnstileError) {
        setErrorMsg("人机验证环境异常，请刷新页面重试");
        return;
      }
      setErrorMsg("安全检测中，请稍候...");
      setPendingMessage(input); // 缓冲这条消息
      return;
    }
    
    posthog?.capture('chat_message_sent', { isFirstMessage: userMsgCount === 0 });
    sendMessage(
      { text: input },
      { body: { 
          context_diary_id: activeContextDiaryId, 
          turnstile_token: (!user && userMsgCount === 0) ? turnstileToken : undefined,
          new_session: (!user && userMsgCount === 0) ? true : undefined
        } 
      }
    );
    setInput("");
    setErrorMsg(""); // clear error on new message
  };

  // Auto-hide error message after 3 seconds
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const hasReachedTurnLimit = userMsgCount >= 30;
  const showTurnLimitUI = hasReachedTurnLimit && !isLoading;
  
  // Anonymous limits
  const isAnonymous = !Cookies.get("auth_token"); // Check if user is anonymous (simple check)
  const isApproachingAnonLimit = isAnonymous && userMsgCount >= 8 && userMsgCount < 10;
  const showApproachingAnonLimitUI = isApproachingAnonLimit && !isLoading;
  const hasReachedAnonLimit = isAnonymous && userMsgCount >= 10;
  const showReachedAnonLimitUI = hasReachedAnonLimit && !isLoading;

  const getEmptyStateContent = () => {
    if (topic === "工作焦虑") {
      return { title: "面对工作", subtitle: "不要急，慢慢说，是哪些事情让你感到焦虑？" };
    }
    if (topic === "关系困扰") {
      return { title: "关于你们", subtitle: "感情中的结，我们一点点解开。今天发生了什么？" };
    }
    if (topic === "自我探索") {
      return { title: "向内探索", subtitle: "在这个专属的空间里，让我们一起倾听你真实的声音。" };
    }
    return { title: "深呼吸", subtitle: "写下你此刻的想法，想到什么就说什么，随意一点就好。" };
  };

  const emptyState = getEmptyStateContent();

  const { viewportHeight, isNavVisible, scrollContainerRef } = useChatScroll(
    messages,
    isInitializing,
    status,
    hasReachedTurnLimit,
    isLongIdleTime
  );

  return (
    <main 
      style={{ height: viewportHeight }}
      className="fixed top-0 left-0 w-full flex flex-col bg-background font-sans z-40 overflow-hidden"
    >
      <div className="flex-1 w-full max-w-3xl mx-auto flex flex-col min-h-0 relative">
        {/* 极微弱的背景呼吸光晕 */}
      <motion.div 
        animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-sage-light/30 rounded-full blur-3xl -z-10 pointer-events-none"
      />
      <motion.div 
        animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.1, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-sage-light/20 rounded-full blur-3xl -z-10 pointer-events-none"
      />

      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: isInitializing ? 0 : 1 }} 
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl mx-auto bg-white/90 sm:bg-white/80 backdrop-blur-xl sm:rounded-3xl sm:shadow-sm sm:shadow-sage-primary/10 flex flex-col flex-1 min-h-0 sm:border border-white/50 sm:my-6 relative overflow-hidden"
      >
        <AnimatePresence>
          {/* 全局的进度胶囊已移至 Header.tsx */}
        </AnimatePresence>
        
        <button 
          onClick={() => router.push('/')}
          className={`absolute top-4 sm:top-6 z-40 p-2.5 rounded-full transition-all duration-500 ${
            isNavVisible 
                  ? 'opacity-100 translate-x-0 left-4 sm:left-6 bg-white/50 backdrop-blur-md text-sage-dark/70 hover:text-sage-dark hover:bg-white/70 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] border border-white/60' 
                  : 'opacity-80 -translate-x-[65%] left-0 bg-sage-primary/90 backdrop-blur-md text-white border border-sage-primary/50 hover:-translate-x-1/4 hover:opacity-100 shadow-[2px_0_10px_rgba(163,177,138,0.4)]'
          }`}
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>

        <div className="absolute top-4 sm:top-6 left-0 w-full h-[44px] z-50 transition-all duration-500 pointer-events-none opacity-100 translate-y-0">
          <GlobalGeneratingIndicator />
        </div>

        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 text-red-600/80 px-4 py-2.5 text-sm text-center font-medium"
          >
            {errorMsg}
          </motion.div>
        )}

        <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pt-6 pb-6 space-y-6 transition-all duration-700">
          <MessageList
            messages={messages}
            status={status}
            contextDiaryTitle={contextDiaryTitle}
            emptyState={emptyState}
            user={user}
            isLongIdleTime={isLongIdleTime}
            hasUnprocessed={hasUnprocessed}
            userMsgCount={userMsgCount}
            canGenerate={canGenerate}
            isGenerating={isGenerating}
            isLoading={isLoading}
            hasReachedAnonLimit={showReachedAnonLimitUI}
            hasReachedTurnLimit={showTurnLimitUI}
            handleGenerateDiary={handleGenerateDiaryWithQuotaCheck}
          />
        </div>

        <ChatInputArea 
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading || pendingMessage !== null}
          isGenerating={isGenerating}
          hasReachedAnonLimit={showReachedAnonLimitUI}
          hasReachedTurnLimit={showTurnLimitUI}
          isApproachingAnonLimit={showApproachingAnonLimitUI}
          userMsgCount={userMsgCount}
          setShowActionSheet={setShowActionSheet}
          isDisabledLogical={hasReachedAnonLimit || hasReachedTurnLimit}
        />
      </motion.div>
      
      {!user && userMsgCount === 0 && (
        <Turnstile
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string}
          onSuccess={(token) => {
            setTurnstileToken(token);
            setTurnstileError(false);
          }}
          onError={() => {
            setTurnstileError(true);
            setPendingMessage(null);
            setErrorMsg("人机验证组件加载失败，请刷新页面重试");
          }}
          onExpire={() => {
            setTurnstileToken(null);
          }}
          options={{ size: "invisible" }}
        />
      )}
      
      <GeneratingOverlay isGenerating={isGenerating} />

      <ChatActionSheet
        showActionSheet={showActionSheet}
        setShowActionSheet={setShowActionSheet}
        canGenerate={canGenerate}
        hasUnprocessed={hasUnprocessed}
        handleGenerateDiary={handleGenerateDiaryWithQuotaCheck}
        sessionId={sessionId}
        setErrorMsg={setErrorMsg}
        messages={messages}
      />
      </div>
    </main>
  );
}
