import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[BFF] Received body:", JSON.stringify(body));

    // 解析出最新的用户消息
    let lastMsg = null;
    if (body.messages && Array.isArray(body.messages) && body.messages.length > 0) {
      lastMsg = body.messages[body.messages.length - 1];
    } else {
      lastMsg = body;
    }

    let content = lastMsg.content || lastMsg.text || "";
    if (!content && Array.isArray(lastMsg.parts)) {
      content = lastMsg.parts
        .filter((part: any) => part.type === "text" || part.type === "text-delta")
        .map((part: any) => part.text || part.content || part.delta || "")
        .join("");
    }

    // 尝试获取 sessionId：前端通常会把它放在 body 或者我们可以从 header 获取
    const headersList = req.headers;
    let sessionId = headersList.get("x-guest-session-id");
    
    // 如果 Header 中没有，尝试从 body.session_id 获取（如果前端手动附带）
    if (!sessionId && body.session_id) {
        sessionId = body.session_id;
    }
    
    // 如果还没有，尝试从 cookie 中获取 (如果作为备用)
    if (!sessionId) {
        const cookieStore = await cookies();
        sessionId = cookieStore.get("guest_session_id")?.value ?? null;
    }

    if (!sessionId) {
      return NextResponse.json({ detail: "Missing session_id" }, { status: 400 });
    }

    const payload = {
      session_id: sessionId,
      message: {
        role: lastMsg.role || "user",
        content: content
      },
      context_diary_id: body.context_diary_id || null
    };
    
    console.log("[BFF] Forwarding payload to backend:", JSON.stringify(payload));

    // 获取 Auth Token
    const authHeader = headersList.get("Authorization");

    const backendRes = await fetch("http://127.0.0.1:8000/api/v1/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { "Authorization": authHeader } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!backendRes.ok) {
        const errorText = await backendRes.text();
        console.error("[BFF] Backend error:", backendRes.status, errorText);
        return new Response(errorText, { status: backendRes.status, headers: backendRes.headers });
    }

    const safeHeaders = new Headers();
    safeHeaders.set("X-Vercel-AI-UI-Message-Stream", "v1");
    safeHeaders.set("Content-Type", "text/event-stream; charset=utf-8");
    safeHeaders.set("Cache-Control", "no-cache");
    safeHeaders.set("Connection", "keep-alive");

    // 抛弃所有画蛇添足的壳子，纯原生零损耗透传
    return new Response(backendRes.body, {
      status: backendRes.status,
      headers: safeHeaders,
    });

  } catch (err: any) {
    console.error("[BFF] Exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
