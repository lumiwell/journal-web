import { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import Cookies from 'js-cookie';
import { fetchWithAuth } from '@/lib/api';

const IDLE_TIMEOUT_MS = 1 * 60 * 1000;

export function useChatSession(sessionId: string, backgroundGenerating: boolean, initialContextDiaryId?: string) {
  const [contextDiaryTitle, setContextDiaryTitle] = useState<string | null>(null);
  const [activeContextDiaryId, setActiveContextDiaryId] = useState<string | null>(initialContextDiaryId || null);
  const activeContextDiaryIdRef = useRef<string | null>(initialContextDiaryId || null);
  const [messageDiaryMap, setMessageDiaryMap] = useState<Record<string, string>>({});
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLongIdleTime, setIsLongIdleTime] = useState(false);

  // 1. 初始化上下文日记ID
  useEffect(() => {
    if (initialContextDiaryId) {
      setActiveContextDiaryId(initialContextDiaryId);
      localStorage.setItem("current_context_diary_id", initialContextDiaryId);
    } else {
      const stored = localStorage.getItem("current_context_diary_id");
      if (stored) {
        setActiveContextDiaryId(stored);
        activeContextDiaryIdRef.current = stored;
      }
    }
  }, [initialContextDiaryId]);

  useEffect(() => {
    activeContextDiaryIdRef.current = activeContextDiaryId;
    if (activeContextDiaryId) {
      Cookies.set("context_diary_id", activeContextDiaryId, { path: "/" });
    } else {
      Cookies.remove("context_diary_id", { path: "/" });
    }
  }, [activeContextDiaryId]);

  // 2. 获取上下文日记标题
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
        .catch(err => console.warn("Failed to load context diary title (silent):", err));
    } else {
      setContextDiaryTitle(null);
    }
  }, [activeContextDiaryId, sessionId]);

  // 3. 配置 Vercel AI SDK 的 useChat
  const { messages, setMessages, sendMessage, status, error } = useChat({
    // @ts-expect-error AI SDK v4 的类型定义缺陷，api 在运行时是完全受支持的
    api: "/api/chat",
    body: {
      session_id: sessionId,
      context_diary_id: activeContextDiaryId
    },
    headers: {
      "Authorization": Cookies.get("auth_token") ? `Bearer ${Cookies.get("auth_token")}` : ""
    },
    onError: (err) => {
      console.error("❌ [useChat 调试] 解析过程中发生报错:", err);
    }
  });

  // 4. 拉取历史记录
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
          displayData = data.filter((msg: any) => msg.diary_id);
        }

        const formatted = displayData.map((msg: any) => {
          let dateObj = new Date();
          if (msg.created_at) {
            dateObj = new Date(msg.created_at.endsWith("Z") ? msg.created_at : msg.created_at + "Z");
          }
          return {
            id: msg.id,
            role: msg.role,
            content: msg.content,
            createdAt: dateObj
          };
        });
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
  }, [sessionId, backgroundGenerating]); // 移除 setMessages 防止循环依赖

  // 动态计算距离上一条消息是否闲置超时
  useEffect(() => {
    if (!messages || messages.length === 0) {
      setIsLongIdleTime(false);
      return;
    }
    
    const lastMsg = messages[messages.length - 1];
    const lastTime = (lastMsg as any).createdAt ? new Date((lastMsg as any).createdAt).getTime() : Date.now();
    
    const checkIdle = () => {
      setIsLongIdleTime(Date.now() - lastTime > IDLE_TIMEOUT_MS);
    };
    
    checkIdle(); // 仅在加载和消息变动时检查，不使用定时器轮询，避免突然弹出的惊吓感
  }, [messages]);

  const isLoading = status === "submitted" || status === "streaming";

  return {
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
    reload: loadHistory
  };
}
