"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { fetchWithAuth } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function ChatUI({ sessionId, readonly = false }: { sessionId: string, readonly?: boolean }) {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  // 记录每个 message id 是否属于某个日记
  const [messageDiaryMap, setMessageDiaryMap] = useState<Record<string, string>>({});

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
      const url = readonly ? `/api/v1/diaries/${sessionId}/messages` : `/api/v1/chat/${sessionId}/messages`;
      const res = await fetchWithAuth(url);
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
        }));
        setMessages(formatted);
        
        // Record diary_ids to determine divider
        const map: Record<string, string> = {};
        data.forEach((msg: any) => {
          if (msg.diary_id) {
            map[msg.id] = msg.diary_id;
          }
        });
        setMessageDiaryMap(map);
      } else {
        if (readonly) {
          setLoadError(true);
        }
      }
    } catch (err) {
      console.error("Failed to load chat history", err);
      if (readonly) setLoadError(true);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [sessionId, setMessages, readonly]);

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
    setErrorMsg(""); // clear error on new message
  };

  const handleGenerateDiary = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setErrorMsg("");
    try {
      const res = await fetchWithAuth(`/api/v1/diary/generate?session_id=${sessionId}`, {
        method: "POST"
      });
      if (res.ok) {
        // Success
        await loadHistory();
        router.push("/history"); // Navigate to history to see the new diary
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
      setIsGenerating(false);
    }
  };

  // Auto-hide error message after 3 seconds
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const hasUnprocessedMessages = messages.length > 0 && messages.some(msg => !messageDiaryMap[msg.id]);

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg flex flex-col h-[85vh]">
        
        <div className="p-4 border-b border-gray-100 flex justify-between items-center relative">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Journal</h1>
            <p className="text-xs text-gray-400">基于 CBT 的自我觉察树洞</p>
          </div>
          {!readonly && (
            <button 
              onClick={handleGenerateDiary}
              disabled={isGenerating || isLoading || !hasUnprocessedMessages}
              className="text-sm bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? "生成中..." : "✨ 生成日记"}
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 px-4 py-2 text-sm text-center animate-pulse">
            {errorMsg}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-20 h-full flex items-center justify-center">
              {readonly ? (
                loadError ? (
                  <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-sm border border-red-50">
                    <div className="w-16 h-16 bg-red-50 text-red-400 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p className="text-lg font-bold text-gray-800">日记不存在或无权访问</p>
                    <p className="text-sm text-gray-500 text-center max-w-[250px]">
                      这段回忆可能已经被遗忘，或者你正在访问不属于你的日记。
                    </p>
                    <button 
                      onClick={() => router.push("/history")} 
                      className="mt-6 px-6 py-2.5 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors text-sm font-medium shadow-md"
                    >
                      返回日记列表
                    </button>
                  </div>
                ) : (
                  <div className="animate-pulse flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-400">正在翻阅快照...</p>
                  </div>
                )
              ) : (
                "写下你此刻的想法或情绪，我们开始梳理。"
              )}
            </div>
          ) : (
            messages.map((msg, index) => {
              const partsText = msg.parts && msg.parts.length > 0
                ? msg.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join("")
                : ((msg as any).content || "");
              const displayedText = partsText.replace(/[\s\u200B-\u200D\uFEFF]/g, "");
              
              if (msg.role === "assistant" && !displayedText) {
                return (
                  <div key={index} className="flex justify-start">
                    <div className="bg-gray-100 text-gray-500 p-3 rounded-2xl rounded-bl-none text-sm animate-pulse">
                      正在倾听并思考...
                    </div>
                  </div>
                );
              }

              const msgElement = (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div 
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      msg.role === "user" 
                        ? "bg-blue-600 text-white rounded-br-none" 
                        : "bg-gray-100 text-gray-800 rounded-bl-none"
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
                </div>
              );

              const currentDiaryId = messageDiaryMap[msg.id];
              const nextMsg = messages[index + 1];
              const nextDiaryId = nextMsg ? messageDiaryMap[nextMsg.id] : undefined;
              const isLastMessage = index === messages.length - 1;
              const shouldShowDivider = !readonly && currentDiaryId && (isLastMessage || currentDiaryId !== nextDiaryId);

              // 插入状态分割线
              if (shouldShowDivider) {
                return (
                  <div key={`fragment-${msg.id}`}>
                    {msgElement}
                    <div className="flex items-center justify-center my-6">
                      <div className="border-t border-gray-200 flex-grow"></div>
                      <span className="mx-4 text-xs text-gray-400 font-medium tracking-wider">以上对话已生成日记</span>
                      <div className="border-t border-gray-200 flex-grow"></div>
                    </div>
                  </div>
                );
              }

              return msgElement;
            })
          )}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-500 p-3 rounded-2xl rounded-bl-none text-sm animate-pulse">
                正在倾听并思考...
              </div>
            </div>
          )}
        </div>

        {!readonly && (
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 flex gap-2">
            <input
              type="text"
              className="flex-1 border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500"
              placeholder="描述一下让你困扰的事件或情绪..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading || isGenerating}
            />
            <button
              type="submit"
              disabled={isLoading || isGenerating || !input.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
              发送
            </button>
          </form>
        )}

      </div>
    </main>
  );
}
