"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { fetchWithAuth } from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2, ChevronLeft, Trash2, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import GlobalGeneratingIndicator from "./GlobalGeneratingIndicator";
import ConfirmModal from "./ConfirmModal";

// ==========================================
// 🕒 情绪断代时间配置（方便本地测试）
// 测试时可以把这些值改成较短的时间，例如 1 * 60 * 1000 (1分钟)
// ==========================================
const IDLE_TIMEOUT_MS = 1 * 60 * 1000;         // 常规代谢：默认 6 小时 (测试环境 1 分钟)
const AGE_TIMEOUT_MS = 24 * 60 * 60 * 1000;        // 极限代谢：会话总寿命大于 24 小时
const SHORT_IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000;  // 极限代谢附属条件：闲置大于 2 小时

export default function ChatUI({ sessionId, diaryId, topic, t, contextDiaryId }: { sessionId: string, diaryId?: string, topic?: string, t?: string, contextDiaryId?: string }) {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStepIdx, setGenerationStepIdx] = useState(0);
  const [contextDiaryTitle, setContextDiaryTitle] = useState("");
  const { user, isExtractingDiary: backgroundGenerating, setIsExtractingDiary: setBackgroundGenerating } = useAuth();
  const [errorMsg, setErrorMsg] = useState("");
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [remainingClearCount, setRemainingClearCount] = useState<number | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [viewportHeight, setViewportHeight] = useState('100dvh');
  const router = useRouter();

  useEffect(() => {
    const updateHeight = () => {
      setViewportHeight(`${window.visualViewport ? window.visualViewport.height : window.innerHeight}px`);
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeight);
    }
    
    return () => {
      window.removeEventListener('resize', updateHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateHeight);
      }
    };
  }, []);

  const executeClearChat = async () => {
    try {
      const res = await fetchWithAuth(`/api/v1/chat/${sessionId}/messages`, { method: "DELETE" });
      if (!res.ok) {
        if (res.status === 429) {
          setErrorMsg("今日清空次数已用尽，请沉淀日记以开启新篇章");
        } else {
          setErrorMsg("清空对话失败，请重试");
        }
        return;
      }
      setMessages([]);
      setMessageDiaryMap({});
      setShowActionSheet(false);
      localStorage.removeItem("current_context_diary_id");
      setActiveContextDiaryId(null);
      setContextDiaryTitle(null);
    } catch (err) {
      console.error("Failed to clear chat", err);
      setErrorMsg("清空对话失败，请重试");
    }
  };

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

  const [activeContextDiaryId, setActiveContextDiaryId] = useState<string | null>(null);

  useEffect(() => {
    if (contextDiaryId) {
      localStorage.setItem("current_context_diary_id", contextDiaryId);
      setActiveContextDiaryId(contextDiaryId);
    } else {
      const stored = localStorage.getItem("current_context_diary_id");
      if (stored) {
        setActiveContextDiaryId(stored);
      }
    }
  }, [contextDiaryId]);

  // Fetch context diary title if continuing exploration
  useEffect(() => {
    if (activeContextDiaryId) {
      fetchWithAuth(`/api/v1/diaries/${activeContextDiaryId}?session_id=${sessionId}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error("Failed to load context diary");
        })
        .then(data => {
          if (data && data.title) setContextDiaryTitle(data.title);
        })
        .catch(err => console.error("Error loading context diary:", err));
    } else {
      setContextDiaryTitle(null);
    }
  }, [activeContextDiaryId, sessionId]);

  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        session_id: sessionId,
        context_diary_id: activeContextDiaryId
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
      try {
        const errorData = JSON.parse(err.message);
        if (errorData.detail === "SESSION_TURN_LIMIT_REACHED") {
          return; // Handled by UI
        }
        if (errorData.detail === "REGISTRATION_REQUIRED") {
          return; // Handled by UI
        }
      } catch (e) {
        // Not JSON
      }
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
        if (backgroundGenerating) {
          // 如果后台正在生成，隐藏掉尚未封存的老消息（它们正在被打包生成日记），避免闪烁或干扰“新篇章”
          displayData = data.filter((msg: any) => msg.diary_id);
        } else {
          if (data.length > 0 && data[0].created_at) {
            const firstMsg = data[0];
            const lastMsg = data[data.length - 1];
            const firstTime = new Date(firstMsg.created_at.endsWith("Z") ? firstMsg.created_at : firstMsg.created_at + "Z").getTime();
            const lastTime = new Date(lastMsg.created_at.endsWith("Z") ? lastMsg.created_at : lastMsg.created_at + "Z").getTime();
            const now = Date.now();
            
            let lastActiveTime = lastTime;
            if (now - lastTime > IDLE_TIMEOUT_MS) {
              setIsLongIdleTime(true);
            } else {
              setIsLongIdleTime(false);
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

  const [isNavVisible, setIsNavVisible] = useState(true);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let lastScrollY = container.scrollTop;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = container.scrollTop;
          // 当接近底部时，强制显示输入框 (距离底部 80px 以内)
          const isAtBottom = container.clientHeight + currentScrollY >= container.scrollHeight - 80;
          
          if (isAtBottom) {
            setIsNavVisible(true);
          } else if (currentScrollY < lastScrollY - 15) {
            // 向上滚动（看旧消息） -> 隐藏 UI，进入完全沉浸模式
            setIsNavVisible(false);
          } else if (currentScrollY > lastScrollY + 15) {
            // 向下滚动（回到最新消息） -> 浮现 UI
            setIsNavVisible(true);
          }
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [sessionId, setMessages, backgroundGenerating]);

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading || input.length > 1000) return;
    sendMessage({ text: input });
    setInput("");
    setErrorMsg(""); // clear error on new message
  };

  const [isLongIdleTime, setIsLongIdleTime] = useState(false);

  const handleGenerateDiary = async (isFromCurtain: boolean = false) => {
    if (isGenerating || backgroundGenerating) return;

    if (isFromCurtain) {
      // Async background generation without blocking UI
      setBackgroundGenerating(true);
      
      // 清空当前 UI 的聊天记录，开启真正的“全新篇章”
      setMessages([]);
      localStorage.removeItem("current_context_diary_id");
      setActiveContextDiaryId(null);
      setContextDiaryTitle(null);
      
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
                if (res.status === 401 || detailStr === "REGISTRATION_REQUIRED") {
                  router.push("/register?returnTo=/chat");
                  return;
                }
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
        localStorage.removeItem("current_context_diary_id");
        setActiveContextDiaryId(null);
        setContextDiaryTitle(null);
        const diary = await res.json();
        router.push(`/diary/${diary.id}`);
        return;
      } else if (res.status === 429) {
        setErrorMsg("日记正在生成中，请稍后再试...");
        return;
      } else if (res.status === 401) {
        router.push("/register?returnTo=/chat");
        return;
      } else if (res.status === 504 || res.status === 502) {
        throw new Error("Proxy timeout"); // Will be caught and handled below
      } else {
        const errData = await res.json();
        const detailStr = typeof errData.detail === 'string' ? errData.detail : "无可用的新消息生成日记";
        
        if (detailStr === "REGISTRATION_REQUIRED") {
          router.push("/register?returnTo=/chat");
          return;
        }
        
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
              localStorage.removeItem("current_context_diary_id");
              setActiveContextDiaryId(null);
              setContextDiaryTitle(null);
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
  const hasReachedTurnLimit = userMsgCount >= 30;
  
  // Anonymous limits
  const isAnonymous = !Cookies.get("auth_token"); // Check if user is anonymous (simple check)
  const isApproachingAnonLimit = isAnonymous && userMsgCount >= 8 && userMsgCount < 10;
  const hasReachedAnonLimit = isAnonymous && userMsgCount >= 10;

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
  }, [messages, isInitializing, viewportHeight, status, hasReachedTurnLimit, isLongIdleTime]);

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
        className="w-full max-w-2xl bg-white/90 sm:bg-white/80 backdrop-blur-xl sm:rounded-3xl sm:shadow-sm sm:shadow-sage-primary/10 flex flex-col flex-1 min-h-0 sm:border border-white/50 sm:mb-4 relative overflow-hidden"
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
          {messages.length === 0 ? (
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
          ) : (
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
            </>
          )}

          {user && isLongIdleTime && hasUnprocessed && canGenerate && !isGenerating && !isLoading && !hasReachedAnonLimit && !hasReachedTurnLimit && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex justify-center my-6">
              <div className="bg-sage-light/20 text-sage-dark/70 text-[13px] px-6 py-3 rounded-2xl max-w-[85%] text-center leading-relaxed">
                距离上一次倾诉已经过去很久了。<br />
                你可以点击 <button onClick={() => handleGenerateDiary(true)} className="text-sage-primary font-medium hover:underline inline">生成日记</button> 开启新篇章，也可继续当前话题。
              </div>
            </motion.div>
          )}
          
          {hasReachedTurnLimit && status !== "streaming" && status !== "submitted" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex justify-center my-6">
              <div className="text-sage-dark/80 text-[14px] max-w-[85%] text-center leading-relaxed">
                你已经走得很深了，现在是时候收获了。<br />
                你可以点击 <button onClick={() => handleGenerateDiary(false)} disabled={isGenerating || isLoading} className="text-sage-primary font-medium hover:underline inline">生成日记</button>。<br/>
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
        </div>

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
          
          <form onSubmit={handleSubmit} className="flex gap-2 items-end max-w-3xl mx-auto w-full relative">
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
                onKeyDown={handleKeyDown}
                disabled={isGenerating || hasReachedAnonLimit || hasReachedTurnLimit}
              />
            </div>
            
            {input.trim() ? (
              <button
                type="submit"
                disabled={isLoading || isGenerating || input.length > 1000 || hasReachedAnonLimit || hasReachedTurnLimit}
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
      </motion.div>
      
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

      <AnimatePresence>
        {showActionSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActionSheet(false)}
              className="absolute inset-0 z-[60] bg-sage-dark/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 z-[70] bg-white/95 backdrop-blur-xl rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] border-t border-sage-light/30 p-6 pb-[max(2rem,env(safe-area-inset-bottom))]"
            >
              <div className="w-12 h-1.5 bg-sage-light/80 rounded-full mx-auto mb-8" />
              
              <div className="max-w-md mx-auto flex gap-6 px-2">
                <button
                  onClick={() => {
                    setShowActionSheet(false);
                    handleGenerateDiary(false);
                  }}
                  disabled={!canGenerate}
                  className="flex flex-col items-center gap-2.5 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-[60px] h-[60px] rounded-2xl bg-sage-50 text-sage-primary flex items-center justify-center shadow-sm group-hover:bg-sage-100 transition-colors">
                    <Sparkles size={24} />
                  </div>
                  <span className="text-[13px] font-medium text-sage-dark">封存日记</span>
                </button>
                
                <button
                  onClick={async () => {
                    try {
                      const res = await fetchWithAuth(`/api/v1/chat/${sessionId}/messages/clear_limit`);
                      if (res.ok) {
                        const data = await res.json();
                        if (data.remaining > 0) {
                          setRemainingClearCount(data.remaining);
                          setShowActionSheet(false);
                          setShowConfirm(true);
                        } else {
                          setErrorMsg("今日清空次数已用尽，请沉淀日记以开启新篇章");
                          setShowActionSheet(false);
                        }
                      }
                    } catch (e) {
                      // Fallback to just show confirm
                      setRemainingClearCount(null);
                      setShowActionSheet(false);
                      setShowConfirm(true);
                    }
                  }}
                  disabled={!hasUnprocessed}
                  className="flex flex-col items-center gap-2.5 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className={`w-[60px] h-[60px] rounded-2xl flex items-center justify-center shadow-sm transition-colors ${!hasUnprocessed ? 'bg-gray-100 text-gray-400' : 'bg-red-50 text-red-500 group-hover:bg-red-100'}`}>
                    <Trash2 size={24} />
                  </div>
                  <span className={`text-[13px] font-medium ${!hasUnprocessed ? 'text-gray-400' : 'text-sage-dark'}`}>重置对话</span>
                </button>
              </div>
              
              <div className="max-w-md mx-auto mt-6 space-y-4">
                {process.env.NODE_ENV === 'development' && (
                  <button
                    onClick={() => {
                      setShowActionSheet(false);
                      
                      let exportText = "";
                      let roundCount = 0;

                      messages.forEach((msg) => {
                        const partsText = msg.parts && msg.parts.length > 0
                          ? msg.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join("")
                          : ((msg as any).content || "");
                          
                        if (!partsText.trim()) return;
                          
                        if (msg.role === "user") {
                          roundCount++;
                          if (roundCount > 1) exportText += "\n";
                          exportText += `## 第${roundCount}轮\n用户：${partsText}\n`;
                        } else if (msg.role === "assistant") {
                          if (roundCount === 0) {
                            roundCount++;
                            exportText += `## 第${roundCount}轮\n`;
                          }
                          exportText += `\n回复：\n${partsText}\n\n`;
                        }
                      });

                      navigator.clipboard.writeText(exportText.trim())
                        .then(() => alert("【开发者工具】对话记录复制成功！"))
                        .catch(() => alert("复制失败"));
                    }}
                    className="w-full py-4 text-[14px] font-medium text-sage-primary/80 bg-sage-50/50 rounded-2xl hover:bg-sage-100/50 transition-colors border border-sage-200/50"
                  >
                    👨‍💻 [内部] 导出本局对话供调优
                  </button>
                )}

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
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title="重置当前对话？"
        description={remainingClearCount !== null ? `这将会彻底清空当前尚未记录的对话。\n每天有 2 次强制清空对话的特权，您当前还剩余 ${remainingClearCount} 次。确定要使用吗？` : "这将会彻底清空当前尚未记录的对话。注意：每天仅可使用 2 次强制清空，是否继续？"}
        confirmText="清空对话"
        onConfirm={() => {
          setShowConfirm(false);
          executeClearChat();
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </main>
  );
}
