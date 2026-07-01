"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { fetchWithAuth } from "@/lib/api";

export default function ChatUI({ sessionId }: { sessionId: string }) {
  // 由于新版 AI SDK 5.0+ / 4.x useChat 底层基于 Transport 架构，不再提供内置的 input 状态管理
  // 我们在本地使用 useState 管理输入框文本
  const [input, setInput] = useState("");

  // 使用 TextStreamChatTransport 接入 Python 后端的非 Vercel 标准 SSE 流
  const { messages, setMessages, sendMessage, status } = useChat({
    transport: new TextStreamChatTransport({
      api: "http://127.0.0.1:8000/api/v1/chat", // 绕过 Next.js 代理，直连避免被 Next dev server 缓冲拦截
      fetch: async (url: string | URL | Request, options?: RequestInit) => {
        const fetchOptions = options ?? {};
        // 适配器逻辑：拦截并转换请求体。将新版 AI SDK 传出的 parts 数组扁平化还原为后端 Pydantic 期待的 content 字段
        if (fetchOptions.body && typeof fetchOptions.body === "string") {
          try {
            const bodyData = JSON.parse(fetchOptions.body);
            if (bodyData && Array.isArray(bodyData.messages) && bodyData.messages.length > 0) {
              // 提取最后一条用户消息
              const lastMsg = bodyData.messages[bodyData.messages.length - 1];
              let content = lastMsg.content || "";
              if (!content && Array.isArray(lastMsg.parts)) {
                content = lastMsg.parts
                  .filter((part: any) => part.type === "text")
                  .map((part: any) => part.text)
                  .join("");
              }
              
              // 组装符合后端新架构的 Payload
              const newBody = {
                session_id: sessionId,
                message: {
                  role: lastMsg.role,
                  content: content
                }
              };
              fetchOptions.body = JSON.stringify(newBody);
            }
          } catch (e) {
            console.error("解析请求体失败:", e);
          }
        }
        
        // Inject auth token if available
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

        // 构造自定义纯文本流以适配 TextStreamChatTransport
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
                    if (data === "[DONE]") {
                      continue;
                    }
                    try {
                      // 解析还原后端 json.dumps 转义后的文本内容
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

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetchWithAuth(`/api/v1/chat/${sessionId}/messages`);
        if (res.ok) {
          const data = await res.json();
          const formatted = data.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
          }));
          setMessages(formatted);
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
    }
    loadHistory();
  }, [sessionId, setMessages]);

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    // 使用 sendMessage 发送文本
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg flex flex-col h-[85vh]">
        
        {/* 头部标题区 */}
        <div className="p-4 border-b border-gray-100 text-center">
          <h1 className="text-xl font-bold text-gray-800">Journal</h1>
          <p className="text-xs text-gray-400">基于 CBT 的自我觉察树洞</p>
        </div>

        {/* 聊天记录滚动区 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              写下你此刻的想法或情绪，我们开始梳理。
            </div>
          ) : (
            messages.map((msg, index) => {
              // 获取所有的可见文本内容，剥离空格和不可见字符
              const partsText = msg.parts && msg.parts.length > 0
                ? msg.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join("")
                : ((msg as any).content || "");
              const displayedText = partsText.replace(/[\s\u200B-\u200D\uFEFF]/g, "");
              
              // 只要 assistant 气泡没有任何有效文字，就一律显示脉冲动画
              if (msg.role === "assistant" && !displayedText) {
                return (
                  <div key={index} className="flex justify-start">
                    <div className="bg-gray-100 text-gray-500 p-3 rounded-2xl rounded-bl-none text-sm animate-pulse">
                      正在倾听并思考...
                    </div>
                  </div>
                );
              }

              return (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div 
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      msg.role === "user" 
                        ? "bg-blue-600 text-white rounded-br-none" 
                        : "bg-gray-100 text-gray-800 rounded-bl-none"
                    }`}
                  >
                    {/* 如果存在 parts 优先渲染 parts，否则渲染 content */}
                    {msg.parts && msg.parts.length > 0 ? (
                      msg.parts.map((part: any, partIdx: number) => {
                        if (part.type === "text") {
                          return <span key={partIdx}>{part.text}</span>;
                        }
                        return null;
                      })
                    ) : (
                      <span>{(msg as any).content}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {/* 补充兜底：如果连空的 assistant 消息都还没被加入列表，也展示脉冲动画 */}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-500 p-3 rounded-2xl rounded-bl-none text-sm animate-pulse">
                正在倾听并思考...
              </div>
            </div>
          )}
        </div>

        {/* 输入区 */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 flex gap-2">
          <input
            type="text"
            className="flex-1 border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500"
            placeholder="描述一下让你困扰的事件或情绪..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            发送
          </button>
        </form>

      </div>
    </main>
  );
}
