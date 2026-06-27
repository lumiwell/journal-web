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
};

export default nextConfig;