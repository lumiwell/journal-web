import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 设置反向代理：前端请求 /api/v1/... 时，转发给本地 FastAPI
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://127.0.0.1:8000/api/v1/:path*",
      },
    ];
  },
  // 暂时屏蔽未开放的应用页面（等待候补名单阶段），强制重定向回首页
  async redirects() {
    return [
      { source: '/chat', destination: '/', permanent: false },
      { source: '/diary/:path*', destination: '/', permanent: false },
      { source: '/journal', destination: '/', permanent: false },
      { source: '/login', destination: '/', permanent: false },
      { source: '/register', destination: '/', permanent: false },
    ];
  },
  // 允许本地局域网 IP 访问 Dev Server 以进行跨域热更新
  allowedDevOrigins: ['10.177.251.241', '127.0.0.1'],
  // 禁用左下角/右下角的黑色 N 图标（开发编译指示器）
  devIndicators: false,
};

export default nextConfig;