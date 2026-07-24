import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ChatUI from "@/components/chat/ChatUI";

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const sp = await searchParams;
  
  // Handle Dodo Payments failure redirect
  if (sp.status === 'failed' || sp.status === 'cancelled') {
    redirect('/#pricing');
  }
  
  const topic = typeof sp.topic === 'string' ? sp.topic : undefined;
  const t = typeof sp.t === 'string' ? sp.t : undefined;
  const context_diary_id = typeof sp.context_diary_id === 'string' ? sp.context_diary_id : undefined;
  const payment_id = typeof sp.payment_id === 'string' ? sp.payment_id : undefined;

  const headersList = await headers();
  const sessionId = headersList.get("x-guest-session-id");

  if (!sessionId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="text-red-500 font-bold">致命错误：服务端未能获取到有效的安全会话 ID。</div>
      </main>
    );
  }

  return <ChatUI sessionId={sessionId} topic={topic} t={t} contextDiaryId={context_diary_id} paymentId={payment_id} />;
}
