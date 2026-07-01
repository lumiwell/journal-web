import { headers } from "next/headers";
import ChatUI from "@/components/ChatUI";

export default async function Home() {
  // 企业级标准：在 Server Component 中直接读取 Middleware 塞进请求头的单一真实数据源
  const headersList = await headers();
  const sessionId = headersList.get("x-guest-session-id");

  if (!sessionId) {
    // 理论上不可能发生，除非 middleware 未运行或被异常绕过
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 font-sans">
        <div className="text-red-500 font-bold">致命错误：服务端未能获取到有效的安全会话 ID，请刷新页面重试或检查 Middleware。</div>
      </main>
    );
  }

  return <ChatUI sessionId={sessionId} />;
}