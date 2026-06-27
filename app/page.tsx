"use client"; // 🎯 核心考点：强制声明为客户端组件

import { useState } from "react";

// 定义消息的 TypeScript 类型，严谨的工程习惯
type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  // 状态管理：存放整个多轮对话的历史记录
  const [messages, setMessages] = useState<Message[]>([]);
  // 状态管理：当前输入框里的文字
  const [input, setInput] = useState("");
  // 状态管理：是否正在等待 AI 回复
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    // 阻止发送空消息
    if (!input.trim()) return;

    // 1. 将用户的输入立马追加到页面上
    const newMessages: Message[] = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput(""); // 清空输入框
    setIsLoading(true);

    try {
      // 2. 发起请求。这里不会跨域，因为我们在 next.config.mjs 做了反向代理！
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 将整个对话数组发给后端（无状态架构的核心）
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      
      // 3. 拿到后端结果，追加到消息列表中
      if (data.status === "success") {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch (error) {
      console.error("请求失败:", error);
      // 真实业务中这里应该有个 Toast 提示，MVP 阶段我们暂且略过
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg flex flex-col h-[85vh]">
        
        {/* 头部标题区 */}
        <div className="p-4 border-b border-gray-100 text-center">
          <h1 className="text-xl font-bold text-gray-800">Insight Journal</h1>
          <p className="text-xs text-gray-400">基于 CBT 的自我觉察树洞</p>
        </div>

        {/* 聊天记录滚动区 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              写下你此刻的想法或情绪，我们开始梳理。
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div 
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.role === "user" 
                      ? "bg-blue-600 text-white rounded-br-none" 
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-500 p-3 rounded-2xl rounded-bl-none text-sm animate-pulse">
                正在倾听并思考...
              </div>
            </div>
          )}
        </div>

        {/* 输入区 */}
        <div className="p-4 border-t border-gray-100 flex gap-2">
          <input
            type="text"
            className="flex-1 border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500"
            placeholder="描述一下让你困扰的事件或情绪..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            发送
          </button>
        </div>

      </div>
    </main>
  );
}