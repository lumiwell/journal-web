"use client";

import { use } from "react";
import ChatUI from "@/components/ChatUI";
import Link from "next/link";

export default function DiarySnapshotPage({ params }: { params: Promise<{ diary_id: string }> }) {
  // Using React.use to unwrap params per Next.js 15+ standard
  const unwrappedParams = use(params);
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="p-4 bg-white border-b border-gray-100 flex items-center">
        <Link href="/history" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
          <span>&larr; 返回历史</span>
        </Link>
        <span className="ml-4 text-gray-500 text-sm border-l pl-4 border-gray-200">
          对话快照 (只读)
        </span>
      </div>
      <ChatUI sessionId={unwrappedParams.diary_id} readonly={true} />
    </div>
  );
}
