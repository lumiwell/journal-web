"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { fetchWithAuth } from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2, ChevronLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import GlobalGeneratingIndicator from "./GlobalGeneratingIndicator";

// ==========================================
// 🕒 情绪断代时间配置（方便本地测试）
// 测试时可以把这些值改成较短的时间，例如 1 * 60 * 1000 (1分钟)
// ==========================================
const IDLE_TIMEOUT_MS = 1 * 60 * 1000;         // 常规代谢：默认 6 小时
const AGE_TIMEOUT_MS = 24 * 60 * 60 * 1000;        // 极限代谢：会话总寿命大于 24 小时
const SHORT_IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000;  // 极限代谢附属条件：闲置大于 2 小时

export default function ChatUI({ sessionId, diaryId, topic, t }: { sessionId: string, diaryId?: string, topic?: string, t?: string }) {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStepIdx, setGenerationStepIdx] = useState(0);
  const { isExtractingDiary: backgroundGenerating, setIsExtractingDiary: setBackgroundGenerating } = useAuth();
  const [errorMsg, setErrorMsg] = useState("");
  const [showCurtain, setShowCurtain] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const router = useRouter();

  const generationSteps = [
    { title: "正在倾听内心的回音...", subtitle: "安静地深呼吸，那些未言明的思绪，我都懂" },
    { title: "正在抚平纷乱的思绪...", subtitle: "把烦恼交给我，让紧绷的神经稍微休息一下吧" },
    { title: "正在打磨时光的碎片...", subtitle: "我们在字里行间，为你寻找藏在深处的答案" },
    { title: "正在为你凝结日记...", subtitle: "所有的情绪都有它的意义，这份礼物马上就绪" }
  ];

  useEffect(() => {
    if (isGenerating) {
      setGenerationStepIdx(0);
      const interval = setInterval(() => {
        setGenerationStepIdx(prev => (prev < generationSteps.length - 1 ? prev + 1 : prev));
      }, 3500); // 3.5秒切换一次文案
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  // 记录每个 message id 是否属于某个日记
  const [messageDiaryMap, setMessageDiaryMap] = useState<Record<string, string>>({});

  const hasPrefilledRef = useRef(false);
  const isInitialScroll = useRef(true);

  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        session_id: sessionId
      },
      headers: {
        "Authorization": Cookies.get("auth_token") ? `Bearer ${Cookies.get("auth_token")}` : ""
      },
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        const response = await fetch(input, init);
        console.log("🚀 [useChat 调试] 1. 收到首个响应头，状态码:", response.status);
        console.log("🚀 [useChat 调试] 数据流 Header (x-vercel-ai-data-stream):", response.headers.get("x-vercel-ai-data-stream"));
        return response;
      }
    }),
    onFinish: ({ message }) => {
      console.log("✅ [useChat 调试] 2. 流式接收彻底结束！");
      console.log("✅ [useChat 调试] 最终 Vercel SDK 组装成的消息是:", message);
      console.log("✅ [useChat 调试] 当前的完整 messages 数组:", messages);
    },
    onError: (err) => {
      console.error("❌ [useChat 调试] 3. 解析过程中发生严重报错:", err);
      setErrorMsg(`会话中断: ${err.message}`);
    },
  });

  const [loadError, setLoadError] = useState(false);

  const loadHistory = async () => {
    try {
      const url = `/api/v1/chat/${sessionId}/messages`;
      const res = await fetchWithAuth(url);
      if (res.ok) {
        const data = await res.json();
        
        const map: Record<string, string> = {};
        data.forEach((msg: any) => {
          if (msg.diary_id) {
            map[msg.id] = msg.diary_id;
          }
        });
        setMessageDiaryMap(map);

        let displayData = data;
        let willShowCurtain = false;

        if (backgroundGenerating) {
          // 如果后台正在生成，强制隐藏幕布
          setShowCurtain(false);
          // 并且隐藏掉尚未封存的老消息（它们正在被打包生成日记），避免闪烁或干扰“新篇章”
          displayData = data.filter((msg: any) => msg.diary_id);
        } else {
          if (data.length > 0 && data[0].created_at) {
            const firstMsg = data[0];
            const lastMsg = data[data.length - 1];
            const firstTime = new Date(firstMsg.created_at.endsWith("Z") ? firstMsg.created_at : firstMsg.created_at + "Z").getTime();
            const lastTime = new Date(lastMsg.created_at.endsWith("Z") ? lastMsg.created_at : lastMsg.created_at + "Z").getTime();
            const now = Date.now();
            
            let lastActiveTime = lastTime;
            const acknowledgedAt = parseInt(sessionStorage.getItem(`curtain_acknowledged_${sessionId}`) || "0", 10);
            const dismissedAt = parseInt(sessionStorage.getItem(`curtain_dismissed_${sessionId}`) || "0", 10);
            const latestAction = Math.max(acknowledgedAt, dismissedAt);
            
            if (latestAction > lastTime) {
              lastActiveTime = latestAction;
            }
            
            const idleTime = now - lastActiveTime;
            const ageTime = now - firstTime;
            
            if (idleTime > IDLE_TIMEOUT_MS || (ageTime > AGE_TIMEOUT_MS && idleTime > SHORT_IDLE_TIMEOUT_MS)) {
              setShowCurtain(true);
              willShowCurtain = true;
            }
          }
        }

        const formatted = displayData.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
        }));
        setMessages(formatted);
      }
    } catch (err) {
      console.error("Failed to load chat history", err);
    } finally {
      setTimeout(() => setIsInitializing(false), 50);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [sessionId, setMessages, backgroundGenerating]);

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
    setErrorMsg(""); // clear error on new message
  };

  const handleGenerateDiary = async (isFromCurtain: boolean = false) => {
    if (isGenerating || backgroundGenerating) return;

    if (isFromCurtain) {
      // Async background generation without blocking UI
      setBackgroundGenerating(true);
      setShowCurtain(false);
      
      // 清空当前 UI 的聊天记录，开启真正的“全新篇章”
      setMessages([]);
      
      // 记录关闭幕布的时间，视同活跃
      sessionStorage.setItem(`curtain_dismissed_${sessionId}`, Date.now().toString());

      // 评估标签的新鲜度。如果是刚刚在首页点击带上的标签（t 存在且小于 6 小时），则保留它！
      // 如果标签是很久以前的（比如旧会话残留在 URL 里的），则彻底清除它，回到默认空白状态。
      const isTopicFresh = t && (Date.now() - parseInt(t, 10) < IDLE_TIMEOUT_MS);
      if (!isTopicFresh) {
        router.replace("/chat");
      }

      if (canGenerate) {
        const attemptBackgroundGenerate = async () => {
          let isRunning = true;
          // 最多轮询 15 次 (45秒)，防止无限死循环
          let maxAttempts = 15;
          while (isRunning && maxAttempts > 0) {
            try {
              const res = await fetchWithAuth(`/api/v1/diary/generate?session_id=${sessionId}`, {
                method: "POST"
              });
              
              if (res.ok) {
                isRunning = false; // 正常成功
              } else if (res.status === 400) {
                // 如果后端明确说没有新消息，说明我们之前的某个超时请求已经成功把消息结晶成了日记！
                const errData = await res.json().catch(() => ({}));
                const detailStr = typeof errData.detail === 'string' ? errData.detail : "";
                if (detailStr.includes("No new messages") || detailStr.includes("无可用的新消息")) {
                  isRunning = false;
                } else {
                  console.error("Diary background generation error (400):", detailStr);
                  isRunning = false;
                }
              } else {
                // 收到 429(处理中), 500, 502, 504 或任何其他异常状态码：
                // 这意味着要么后端还在生成，要么是前端网关代理异常/用户跳转导致请求被截断。
                // 统统视为“未完成”，继续静默轮询！
                await new Promise(resolve => setTimeout(resolve, 3000));
                maxAttempts--;
              }
            } catch (err) {
              // 遭遇底层断网、或前端 Router 跳转导致 fetch aborted：不要放弃，后端极有可能还在跑。继续轮询。
              await new Promise(resolve => setTimeout(resolve, 3000));
              maxAttempts--;
            }
          }
          
          // 彻底确认后端完工（或到达最大轮询次数）后，再关闭状态锁
          setBackgroundGenerating(false);
          window.dispatchEvent(new CustomEvent("refresh_diaries"));
        };
        
        attemptBackgroundGenerate();
      } else {
        fetchWithAuth(`/api/v1/chat/${sessionId}/messages`, {
          method: "DELETE"
        }).then(res => {
          // silently succeed
        }).catch(err => {
          console.error(err);
        }).finally(() => {
          setBackgroundGenerating(false);
        });
      }
      return;
    }

    // Normal foreground generation (blocks UI with overlay)
    setIsGenerating(true);
    setErrorMsg("");
    let isSuccess = false;
    try {
      const res = await fetchWithAuth(`/api/v1/diary/generate?session_id=${sessionId}`, {
        method: "POST"
      });
      
      if (res.ok) {
        isSuccess = true;
        const diary = await res.json();
        router.push(`/diary/${diary.id}`);
        return;
      } else if (res.status === 429) {
        setErrorMsg("日记正在生成中，请稍后再试...");
        return;
      } else if (res.status === 504 || res.status === 502) {
        throw new Error("Proxy timeout"); // Will be caught and handled below
      } else {
        const errData = await res.json();
        const detailStr = typeof errData.detail === 'string' ? errData.detail : "无可用的新消息生成日记";
        
        // 如果后端发现没有新消息，可能是在我们之前的请求中已经生成成功了
        if (detailStr.includes("No new messages") || detailStr.includes("无可用的新消息")) {
           throw new Error("Already generated");
        }
        
        setErrorMsg(detailStr);
        return;
      }
    } catch (err) {
      // 核心修复与严谨性升级：处理 Vercel 10秒超时 (504) 导致 JSON 解析失败的兜底。
      // 为了做到 100% 严谨，我们不去粗略检查时间，而是去拉取最新的消息列表，
      // 看看我们当前聊天记录里的最后一条用户消息，是否已经被后端成功打上了 diary_id 的烙印！
      try {
        const checkRes = await fetchWithAuth(`/api/v1/chat/${sessionId}/messages`);
        if (checkRes.ok) {
          const latestMsgs = await checkRes.json();
          const lastLocalUserMsg = [...messages].reverse().find(m => m.role === "user");
          
          if (lastLocalUserMsg) {
            // 在服务器返回的最新消息中找到同一条消息
            const updatedMsgInServer = latestMsgs.find((m: any) => m.id === lastLocalUserMsg.id);
            
            // 如果这条消息已经被分配了 diary_id，说明日记已经绝对生成成功了，且精准定位！
            if (updatedMsgInServer && updatedMsgInServer.diary_id) {
              isSuccess = true;
              router.push(`/diary/${updatedMsgInServer.diary_id}`);
              return;
            }
          }
        }
      } catch (checkErr) {
        console.error("Failed to verify exact message diary status after error:", checkErr);
      }
      
      setErrorMsg("日记生成耗时较长或网络不佳，请稍后刷新首页查看是否生成成功。");
    } finally {
      if (!isSuccess) {
        setIsGenerating(false);
      }
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading && !isGenerating) {
        const syntheticEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
        handleSubmit(syntheticEvent);
      }
    }
  };

  const startNewChapter = () => {
    sessionStorage.setItem(`curtain_dismissed_${sessionId}`, Date.now().toString());
    setShowCurtain(false);
  };

  const handleReviewDiary = (diaryId: string) => {
    sessionStorage.setItem(`curtain_dismissed_${sessionId}`, Date.now().toString());
    router.push(`/diary/${diaryId}`);
  };

  const handleDismissCurtain = () => {
    setShowCurtain(false);
    sessionStorage.setItem(`curtain_acknowledged_${sessionId}`, Date.now().toString());
  };

  const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
  const lastMsgDiaryId = lastUserMsg ? messageDiaryMap[lastUserMsg.id] : null;

  // Auto-hide error message after 3 seconds
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const userMsgCount = messages.filter(m => m.role === "user" && !messageDiaryMap[m.id]).length;
  const canGenerate = userMsgCount >= 2;
  const hasUnprocessed = userMsgCount > 0;

  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!isInitializing && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: isInitialScroll.current ? "auto" : "smooth"
      });
      if (isInitialScroll.current) {
        setTimeout(() => {
          isInitialScroll.current = false;
        }, 100);
      }
    }
  }, [messages, isInitializing]);

  return (
    <main className="flex-1 min-h-0 flex flex-col items-center bg-background sm:p-4 font-sans relative w-full overflow-hidden">
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
        className="w-full max-w-2xl bg-white/90 sm:bg-white/80 backdrop-blur-xl sm:rounded-3xl sm:shadow-sm sm:shadow-sage-primary/10 flex flex-col flex-1 min-h-0 sm:border border-white/50 sm:mb-4 relative overflow-hidden"
      >
        <AnimatePresence>
          {/* 全局的进度胶囊已移至 Header.tsx */}
        </AnimatePresence>
        
        {showCurtain && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70">
              <div className="p-8 max-w-md text-center mx-4">
                {hasUnprocessed ? (
                  <>
                    <h3 className="text-xl font-medium text-sage-dark mb-4 tracking-wide">{canGenerate ? "旧的思绪依然在这里" : "倾诉尚未结晶"}</h3>
                    <p className="text-sage-dark/80 text-[15px] mb-10 leading-relaxed">
                      {canGenerate ? (
                        <>
                          自你上次倾诉已经过去了一段时间。<br/>
                          你可以将之前的思绪结晶为日记，开启新的一天；或者掀开幕布，继续昨天的倾诉。
                        </>
                      ) : (
                        <>
                          你过去的倾诉内容较少，尚未满足生成日记的条件，且已停滞了一段时间。<br/><br/>
                          你可以掀开幕布<span className="font-semibold">继续倾诉</span>，直到结晶为日记；<br/>
                          或者<span className="font-semibold">直接开启新篇章</span>（过去的闲聊将被舍弃）。
                        </>
                      )}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-medium text-sage-dark mb-4 tracking-wide">思绪已妥善封存</h3>
                    <p className="text-sage-dark/80 text-[15px] mb-10 leading-relaxed">
                      你已主动将之前的倾诉结晶为日记，安全地保存在了时光中。<br/>现在，开启一段全新的旅程吧。
                    </p>
                  </>
                )}
                <div className="flex flex-col gap-4 max-w-xs mx-auto">
                {hasUnprocessed ? (
                  <>
                    <button 
                      onClick={() => handleGenerateDiary(true)}
                      disabled={backgroundGenerating || isLoading}
                      className="w-full bg-sage-primary text-white py-3.5 rounded-full text-[15px] font-medium hover:bg-sage-dark transition-all duration-300 shadow-sm disabled:opacity-50"
                    >
                      {canGenerate ? "封存日记，开启新篇章" : "直接开启新篇章"}
                    </button>
                    <button 
                      onClick={handleDismissCurtain}
                      disabled={backgroundGenerating || isGenerating}
                      className="w-full bg-sage-light/50 text-sage-dark py-3.5 rounded-full text-[15px] font-medium hover:bg-sage-light/80 transition-all duration-300"
                    >
                      掀开幕布，继续倾诉
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={startNewChapter}
                      disabled={isGenerating}
                      className="w-full bg-sage-primary text-white py-3.5 rounded-full text-[15px] font-medium hover:bg-sage-dark transition-all duration-300 shadow-sm"
                    >
                      开启新篇章
                    </button>
                    {lastMsgDiaryId && (
                      <button 
                        onClick={() => handleReviewDiary(lastMsgDiaryId)}
                        className="w-full mt-3 bg-sage-light/20 text-sage-dark py-3.5 rounded-full text-[15px] font-medium hover:bg-sage-light/40 transition-all duration-300 shadow-sm border border-sage-light/30 flex items-center justify-center gap-2"
                      >
                        <Sparkles size={18} className="text-sage-primary" />
                        翻阅已封存日记
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className={`py-1.5 px-3 sm:py-2.5 sm:px-4 border-b border-sage-light/40 shadow-sm flex justify-between items-center relative z-20 bg-white/80 backdrop-blur-xl transition-all duration-700 ${showCurtain ? 'opacity-15 pointer-events-none select-none' : ''}`}>
          <GlobalGeneratingIndicator />
          <button 
            onClick={() => router.push('/')}
            className="p-1 -ml-1 text-sage-dark/70 hover:text-sage-dark transition-colors"
          >
            <ChevronLeft size={26} />
          </button>
          <button 
            onClick={() => handleGenerateDiary(false)}
            disabled={isGenerating || isLoading || !canGenerate}
            className={`flex items-center gap-1.5 text-[14px] sm:text-[15px] text-sage-dark font-medium transition-all duration-300 ${
              (canGenerate && !isGenerating && !isLoading) 
                ? "hover:text-sage-primary cursor-pointer hover:scale-105" 
                : "opacity-40 cursor-not-allowed"
            }`}
          >
            {isGenerating ? "正在生成..." : <><Sparkles size={16} /> 生成日记</>}
          </button>
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

        <div ref={scrollContainerRef} className={`flex-1 overflow-y-auto p-6 space-y-6 transition-all duration-700 ${showCurtain ? 'opacity-15 pointer-events-none select-none overflow-hidden' : ''}`}>
          {messages.length === 0 ? (
            <div className="text-center text-sage-muted h-full flex flex-col items-center justify-center">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center">
                <p className="text-lg text-sage-dark/80 mb-2">{emptyState.title}</p>
                <p className="text-sm">{emptyState.subtitle}</p>
              </motion.div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
            {messages.map((msg, index) => {
              const partsText = msg.parts && msg.parts.length > 0
                ? msg.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join("")
                : ((msg as any).content || "");
              const displayedText = partsText.replace(/[\s\u200B-\u200D\uFEFF]/g, "");
              
              if (msg.role === "assistant" && !displayedText) {
                // 如果后端已经停止生成（无论是报错还是断开），就不应该再显示“倾听中”
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
          )}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
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

        </div>

        <div className={`px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/70 sm:bg-white/50 backdrop-blur-md transition-all duration-700 ${showCurtain ? 'opacity-15 pointer-events-none select-none' : ''}`}>
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <div className="flex-1 bg-white rounded-[20px] shadow-sm border border-sage-light/50 py-1 px-2">
              <textarea
                ref={textareaRef}
                className="w-full bg-transparent px-2 py-1.5 text-[15px] focus:outline-none placeholder-sage-muted text-sage-dark resize-none slim-scrollbar block leading-relaxed max-h-[120px]"
                style={{ overflowY: 'auto' }}
                placeholder="此刻的你在想些什么？"
                value={input}
                rows={1}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={handleKeyDown}
                disabled={isGenerating}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || isGenerating || !input.trim()}
              className="bg-sage-primary text-white w-[38px] h-[38px] rounded-full hover:bg-sage-dark disabled:opacity-40 transition-colors flex items-center justify-center shrink-0 shadow-sm mb-0.5"
            >
              <Send size={16} className="-ml-0.5" />
            </button>
          </form>
        </div>

      </motion.div>
      
      {/* 沉浸式生成遮罩 (Immersive Ritual Overlay) */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-50 bg-white/70 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center"
            >
              <div className="flex gap-2 items-center mb-6">
                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity, delay: 0 }} className="w-2 h-2 rounded-full bg-sage-primary shadow-[0_0_10px_rgba(163,177,138,0.5)]"></motion.div>
                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity, delay: 0.6 }} className="w-2 h-2 rounded-full bg-sage-primary shadow-[0_0_10px_rgba(163,177,138,0.5)]"></motion.div>
                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity, delay: 1.2 }} className="w-2 h-2 rounded-full bg-sage-primary shadow-[0_0_10px_rgba(163,177,138,0.5)]"></motion.div>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={generationStepIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center px-4"
                >
                  <h3 className="text-xl font-medium text-sage-dark mb-3 tracking-wider">{generationSteps[generationStepIdx].title}</h3>
                  <p className="text-sm text-sage-muted">{generationSteps[generationStepIdx].subtitle}</p>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
