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
  // 允许本地局域网 IP 访问 Dev Server 以进行跨域热更新
  allowedDevOrigins: ['192.168.32.133'],
};

export default nextConfig;