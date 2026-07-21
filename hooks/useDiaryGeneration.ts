import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/api";

interface UseDiaryGenerationProps {
  sessionId: string;
  t?: string;
  messages: any[];
  setMessages: (messages: any[]) => void;
  backgroundGenerating: boolean;
  setBackgroundGenerating: (val: boolean) => void;
  setActiveContextDiaryId: (id: string | null) => void;
  setContextDiaryTitle: (title: string | null) => void;
  canGenerate: boolean;
  IDLE_TIMEOUT_MS: number;
}

export function useDiaryGeneration({
  sessionId,
  t,
  messages,
  setMessages,
  backgroundGenerating,
  setBackgroundGenerating,
  setActiveContextDiaryId,
  setContextDiaryTitle,
  canGenerate,
  IDLE_TIMEOUT_MS
}: UseDiaryGenerationProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGenerateDiary = async (isFromCurtain: boolean = false) => {
    if (isGenerating || backgroundGenerating) return;

    // Unified generation logic: async background generation without blocking UI
    setBackgroundGenerating(true);
    
    // 清空当前 UI 的聊天记录，开启真正的“全新篇章”
    setMessages([]);
    localStorage.removeItem("current_context_diary_id");
    setActiveContextDiaryId(null);
    setContextDiaryTitle(null);
    
    // 评估标签的新鲜度。如果是刚刚在首页点击带上的标签（t 存在且小于 6 小时），则保留它！
    const isTopicFresh = t && (Date.now() - parseInt(t, 10) < IDLE_TIMEOUT_MS);
    if (!isTopicFresh) {
      router.replace("/chat");
    }

    if (canGenerate) {
      const attemptBackgroundGenerate = async () => {
        let isRunning = true;
        // 最多轮询 15 次 (45秒)，防止无限死循环
        let maxAttempts = 15;
        const bgContextId = localStorage.getItem("current_context_diary_id");
        const bgUrl = bgContextId 
          ? `/api/v1/diary/generate?context_diary_id=${bgContextId}` 
          : `/api/v1/diary/generate`;
        while (isRunning && maxAttempts > 0) {
          try {
            const res = await fetchWithAuth(bgUrl, {
              method: "POST"
            });
            
            if (res.ok) {
              isRunning = false; // 正常成功
            } else if (res.status === 401) {
              router.push("/register?returnTo=/chat");
              return;
            } else if (res.status === 400) {
              const errData = await res.json().catch(() => ({}));
              const detailStr = typeof errData.detail === 'string' ? errData.detail : "";
              if (detailStr === "REGISTRATION_REQUIRED") {
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
              await new Promise(resolve => setTimeout(resolve, 3000));
              maxAttempts--;
            }
          } catch (err) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            maxAttempts--;
          }
        }
        
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
  };

  return { isGenerating, errorMsg, setErrorMsg, handleGenerateDiary };
}
