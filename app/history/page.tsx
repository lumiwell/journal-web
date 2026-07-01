"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import Cookies from "js-cookie";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

type Diary = {
  id: string;
  session_id: string;
  core_emotion: string;
  insight: string;
  created_at: string;
};

export default function HistoryPage() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function loadDiaries() {
      try {
        const sessionId = Cookies.get("guest_session_id");
        if (!sessionId) return;
        
        const res = await fetchWithAuth(`/api/v1/diaries?session_id=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setDiaries(data);
        }
      } catch (err) {
        console.error("Failed to load diaries", err);
      } finally {
        setLoading(false);
      }
    }
    loadDiaries();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-2xl">
        {!user && (
          <div className="bg-blue-50 border border-blue-100 text-blue-800 px-4 py-3 rounded-lg mb-6 text-sm text-center shadow-sm">
            当前为匿名模式，数据仅存本地，<Link href="/register" className="font-semibold underline">注册</Link>以永久云端加密保存你的心境轨迹。
          </div>
        )}

        <h1 className="text-2xl font-bold text-gray-800 mb-6">我的日记资产</h1>

        {loading ? (
          <div className="text-center text-gray-400 py-10">加载中...</div>
        ) : diaries.length === 0 ? (
          <div className="text-center text-gray-400 py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <p>还没有生成的日记，去聊天页面记录一下吧。</p>
            <Link href="/" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition">
              去记录
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {diaries.map(diary => (
              <Link 
                href={`/history/${diary.id}`} 
                key={diary.id}
                className="block bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400 text-sm">
                    {new Date(diary.created_at + "Z").toLocaleString("zh-CN", { 
                      month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" 
                    })}
                  </span>
                  <span className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full font-medium">
                    {diary.core_emotion}
                  </span>
                </div>
                <p className="text-gray-800 font-medium leading-relaxed">
                  "{diary.insight}"
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
