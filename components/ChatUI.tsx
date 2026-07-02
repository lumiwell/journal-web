"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { fetchWithAuth } from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2 } from "lucide-react";

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
  const [backgroundGenerating, setBackgroundGenerating] = useState(false);
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

  const { messages, setMessages, sendMessage, status } = useChat({
    transport: new TextStreamChatTransport({
      api: "http://127.0.0.1:8000/api/v1/chat",
      fetch: async (url: string | URL | Request, options?: RequestInit) => {
        const fetchOptions = options ?? {};
        if (fetchOptions.body && typeof fetchOptions.body === "string") {
          try {
            const bodyData = JSON.parse(fetchOptions.body);
            if (bodyData && Array.isArray(bodyData.messages) && bodyData.messages.length > 0) {
              const lastMsg = bodyData.messages[bodyData.messages.length - 1];
              let content = lastMsg.content || "";
              if (!content && Array.isArray(lastMsg.parts)) {
                content = lastMsg.parts
                  .filter((part: any) => part.type === "text")
                  .map((part: any) => part.text)
                  .join("");
              }
              const newBody = {
                session_id: sessionId,
                message: { role: lastMsg.role, content: content }
              };
              fetchOptions.body = JSON.stringify(newBody);
            }
          } catch (e) {
            console.error("解析请求体失败:", e);
          }
        }
        const token = Cookies.get("auth_token");
        if (token) {
          const headers = new Headers(fetchOptions.headers);
          headers.set("Authorization", `Bearer ${token}`);
          fetchOptions.headers = headers;
        }

        const response = await fetch(url, fetchOptions);
        if (!response.ok) return response;

        const reader = response.body?.getReader();
        if (!reader) return response;

        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        const customStream = new ReadableStream({
          async start(controller) {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const textChunk = decoder.decode(value, { stream: true });
                const lines = textChunk.split("\n");

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (trimmed.startsWith("data: ")) {
                    const data = trimmed.slice(6);
                    if (data === "[DONE]") continue;
                    try {
                      const content = JSON.parse(data);
                      if (typeof content === "string") {
                        controller.enqueue(encoder.encode(content));
                      } else if (content && content.error) {
                        controller.enqueue(encoder.encode(`Error: ${content.error}`));
                      }
                    } catch (e) {
                      controller.enqueue(encoder.encode(data));
                    }
                  }
                }
              }
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          },
        });

        return new Response(customStream, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      },
    }),
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

        const hasUnprocessed = data.some((msg: any) => msg.role === "user" && !msg.diary_id);

        const dismissedAtStr = sessionStorage.getItem(`curtain_dismissed_${sessionId}`);
        const dismissedAt = dismissedAtStr ? parseInt(dismissedAtStr, 10) : 0;

        const filteredData = data.filter((msg: any) => {
          const msgTime = new Date(msg.created_at.endsWith("Z") ? msg.created_at : msg.created_at + "Z").getTime();
          return msgTime >= dismissedAt; // Use >= so that if they start a new chapter, new messages are shown
        });

        let willShowCurtain = false;

        if (filteredData.length > 0 && filteredData[0].created_at) {
          const firstMsg = filteredData[0];
          const lastMsg = filteredData[filteredData.length - 1];
          const firstTime = new Date(firstMsg.created_at.endsWith("Z") ? firstMsg.created_at : firstMsg.created_at + "Z").getTime();
          const lastTime = new Date(lastMsg.created_at.endsWith("Z") ? lastMsg.created_at : lastMsg.created_at + "Z").getTime();
          const now = Date.now();
          
          let lastActiveTime = lastTime;
          // We already filtered by dismissedAt, so we don't need to override lastActiveTime
          // unless the user hasn't sent any messages since dismissing the curtain (which means filteredData is empty anyway, and we wouldn't be in this if block).
          
          const idleTime = now - lastActiveTime;
          const ageTime = now - firstTime;
          
          if (idleTime > IDLE_TIMEOUT_MS || (ageTime > AGE_TIMEOUT_MS && idleTime > SHORT_IDLE_TIMEOUT_MS)) {
            setShowCurtain(true);
            willShowCurtain = true;
          }
        }

        const formatted = filteredData.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
        }));
        setMessages(formatted);
      } else {
        // silently fail or handle later
      }
    } catch (err) {
      console.error("Failed to load chat history", err);
    } finally {
      // Delay slightly to ensure DOM is ready and scrolling can happen before fading in
      setTimeout(() => setIsInitializing(false), 50);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [sessionId, setMessages]);

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
        fetchWithAuth(`/api/v1/diary/generate?session_id=${sessionId}`, {
          method: "POST"
        }).then(res => {
          // silently succeed
        }).catch(err => {
          console.error(err);
        }).finally(() => {
          setBackgroundGenerating(false);
        });
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
      } else if (res.status === 429) {
        setErrorMsg("日记正在生成中，请稍后再试...");
      } else {
        const errData = await res.json();
        const detailStr = typeof errData.detail === 'string' ? errData.detail : "无可用的新消息生成日记";
        setErrorMsg(detailStr);
      }
    } catch (err) {
      setErrorMsg("生成日记请求失败，请检查网络");
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
    <main className="flex-1 min-h-0 flex flex-col items-center bg-background p-4 pt-[90px] font-sans relative w-full overflow-hidden">
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
        className="w-full max-w-2xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm shadow-sage-primary/10 flex flex-col flex-1 min-h-0 border border-white/50 mb-4 relative overflow-hidden"
      >
        <AnimatePresence>
          {backgroundGenerating && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-sage-primary/90 backdrop-blur-md text-white text-[13px] font-medium py-2 px-4 text-center flex items-center justify-center gap-2 z-50 relative"
            >
              <Loader2 size={14} className="animate-spin" />
              <span>正在为你萃取并封存过往的心绪...</span>
            </motion.div>
          )}
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

        <div className={`p-5 border-b border-sage-light/30 flex justify-between items-center relative z-10 transition-all duration-700 ${showCurtain ? 'opacity-15 pointer-events-none select-none' : ''}`}>
          <div>
            <h1 className="text-xl font-medium text-sage-dark tracking-wide">Journal</h1>
            <p className="text-xs text-sage-muted mt-0.5">今天过得好吗？</p>
          </div>
          <button 
            onClick={() => handleGenerateDiary(false)}
            disabled={isGenerating || isLoading || !canGenerate}
            className={`flex items-center gap-2 text-sm bg-sage-light/50 text-sage-dark px-5 py-2.5 rounded-full font-medium transition-all duration-300 shadow-sm ${
              (canGenerate && !isGenerating && !isLoading) 
                ? "hover:bg-sage-light/80 cursor-pointer shadow-sage-primary/20 hover:shadow-md hover:scale-105" 
                : "opacity-40 cursor-not-allowed"
            }`}
          >
            {isGenerating ? "正在沉淀..." : <><Sparkles size={16} /> 生成日记</>}
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
                return (
                  <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                    <div className="flex items-center gap-1.5 text-sage-muted p-4 text-[13px] tracking-wide">
                      <span className="opacity-80">我正在认真倾听</span>
                      <div className="flex gap-1 items-center">
                        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }} className="w-[3px] h-[3px] rounded-full bg-sage-primary"></motion.div>
                        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} className="w-[3px] h-[3px] rounded-full bg-sage-primary"></motion.div>
                        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} className="w-[3px] h-[3px] rounded-full bg-sage-primary"></motion.div>
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
                    className={`max-w-[85%] p-4 text-[15px] leading-relaxed shadow-sm ${
                      isUser 
                        ? "bg-sage-light text-sage-dark rounded-3xl rounded-br-md" 
                        : "bg-transparent text-foreground rounded-3xl px-1"
                    }`}
                  >
                    {msg.parts && msg.parts.length > 0 ? (
                      msg.parts.map((part: any, partIdx: number) => {
                        if (part.type === "text") return <span key={partIdx}>{part.text}</span>;
                        return null;
                      })
                    ) : (
                      <span>{(msg as any).content}</span>
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
              <div className="flex items-center gap-1.5 text-sage-muted p-4 text-[13px] tracking-wide">
                <span className="opacity-80">正在倾听并理解</span>
                <div className="flex gap-1 items-center">
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }} className="w-[3px] h-[3px] rounded-full bg-sage-primary"></motion.div>
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} className="w-[3px] h-[3px] rounded-full bg-sage-primary"></motion.div>
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} className="w-[3px] h-[3px] rounded-full bg-sage-primary"></motion.div>
                </div>
              </div>
            </motion.div>
          )}

        </div>

        <div className={`p-4 bg-white/50 backdrop-blur-md rounded-b-3xl transition-all duration-700 ${showCurtain ? 'opacity-15 pointer-events-none select-none' : ''}`}>
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <div className="flex-1 bg-white rounded-[24px] shadow-sm border border-sage-light/50 py-1.5 px-2">
              <textarea
                ref={textareaRef}
                className="w-full bg-transparent px-3 py-2 text-[15px] focus:outline-none placeholder-sage-muted text-sage-dark resize-none slim-scrollbar block leading-relaxed"
                style={{ overflowY: 'hidden' }}
                placeholder="记录此刻..."
                value={input}
                rows={1}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading || isGenerating}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || isGenerating || !input.trim()}
              className="bg-sage-primary text-white w-[48px] h-[48px] rounded-full hover:bg-sage-dark disabled:opacity-40 transition-colors flex items-center justify-center shrink-0 mb-1 shadow-sm"
            >
              <Send size={18} />
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
            className="absolute inset-0 z-50 rounded-[32px] bg-white/70 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
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
