import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/api";
import Cookies from "js-cookie";

export function useDiaryData(diaryId: string) {
  const [diary, setDiary] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const fetchDiaryAndMessages = async () => {
      try {
        const sessionId = Cookies.get("guest_session_id");
        if (!sessionId) throw new Error("No session ID");

        const diaryRes = await fetchWithAuth(`/api/v1/diaries/${diaryId}?session_id=${sessionId}`);
        if (!diaryRes.ok) throw new Error("Diary not found");
        const diaryData = await diaryRes.json();
        
        // Handle old schema gracefully if content is a string
        if (typeof diaryData.content === 'string') {
           diaryData.content = { fact: diaryData.content };
        }

        setDiary(diaryData);

        const msgRes = await fetchWithAuth(`/api/v1/diaries/${diaryId}/messages?session_id=${sessionId}`);
        if (msgRes.ok) {
           setMessages(await msgRes.json());
        }
      } catch (err) {
        console.error("Failed to load diary", err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    if (diaryId) {
      fetchDiaryAndMessages();
    }
  }, [diaryId]);

  const updateDiaryField = async (fieldPath: string, newValue: string) => {
    if (!diary) return;
    
    // Deep copy
    const updated = { ...diary, content: { ...diary.content } };
    
    if (fieldPath === 'title') {
      updated.title = newValue;
    } else if (fieldPath === 'core_emotion') {
      updated.core_emotion = newValue;
    } else if (fieldPath === 'action_plan.task') {
      if (!updated.content.action_plan) updated.content.action_plan = { status: 'pending' };
      updated.content.action_plan.task = newValue;
    } else {
      updated.content[fieldPath] = newValue;
    }

    setDiary(updated); // Optimistic update

    try {
      const sessionId = Cookies.get("guest_session_id");
      await fetchWithAuth(`/api/v1/diaries/${diary.id}?session_id=${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updated.title,
          core_emotion: updated.core_emotion,
          content: updated.content
        })
      });
    } catch (e) {
      console.error("Failed to update", e);
    }
  };

  const toggleActionStatus = async () => {
    if (!diary || !diary.content?.action_plan) return;
    const currentStatus = diary.content.action_plan.status;
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    const updated = { ...diary, content: { ...diary.content, action_plan: { ...diary.content.action_plan, status: newStatus } } };
    setDiary(updated);

    try {
      const sessionId = Cookies.get("guest_session_id");
      await fetchWithAuth(`/api/v1/diaries/${diary.id}/action_status?session_id=${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  const executeDelete = async (): Promise<boolean> => {
    try {
      const sessionId = Cookies.get("guest_session_id");
      const res = await fetchWithAuth(`/api/v1/diaries/${diary.id}?session_id=${sessionId}`, { method: "DELETE" });
      if (res.ok) {
        return true;
      } else {
        console.error("Delete failed", await res.text());
        return false;
      }
    } catch (e) {
      console.error("Failed to delete diary", e);
      return false;
    }
  };

  const checkExploreConflict = async (): Promise<boolean> => {
    const sessionId = Cookies.get("guest_session_id");
    const msgRes = await fetchWithAuth(`/api/v1/chat/${sessionId}/messages`, { cache: 'no-store' });
    if (msgRes.ok) {
      const msgs = await msgRes.json();
      const unprocessed = msgs.filter((m: any) => m.role === "user" && !m.diary_id).length;
      return unprocessed > 0;
    }
    return false;
  };

  const forceClearChat = async (): Promise<boolean> => {
    const sessionId = Cookies.get("guest_session_id");
    const res = await fetchWithAuth(`/api/v1/chat/${sessionId}/messages`, { method: "DELETE" });
    if (!res.ok) {
      if (res.status === 429) {
        alert("今日清空次数已用尽，无法强行开启新探索。请先将当前思绪结案为日记。");
      } else {
        alert("清空失败，请重试");
      }
      return false;
    }
    return true;
  };

  return {
    diary,
    messages,
    loading,
    loadError,
    updateDiaryField,
    toggleActionStatus,
    executeDelete,
    checkExploreConflict,
    forceClearChat
  };
}
