import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export function middleware(request: NextRequest) {
  // 1. 克隆现有的请求头，准备修改
  const requestHeaders = new Headers(request.headers)

  // 2. 检查是否存在 guest_session_id
  let guestSessionId = request.cookies.get('guest_session_id')?.value

  if (!guestSessionId) {
    guestSessionId = uuidv4()
  }

  // 3. 核心修复：将确定的 sessionId 强制写入【请求头】中，这样下游的 Server Component 才能通过 headers() 读到
  requestHeaders.set('x-guest-session-id', guestSessionId)

  // 4. 将修改后的请求头传给 NextResponse
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // 5. 在响应头中设置/刷新 Cookie 给浏览器
  response.cookies.set('guest_session_id', guestSessionId, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
  })

  return response
}

export const config = {
  matcher: [
    // 排除 api、_next/static、_next/image、favicon.ico 等静态资源
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
