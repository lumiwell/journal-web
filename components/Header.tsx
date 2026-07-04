"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export default function Header() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  if (pathname === "/chat") {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 w-full h-[54px] bg-white/80 backdrop-blur-md border-b border-sage-light/30 shadow-sm px-4 py-1.5 flex justify-between items-center z-50">
      <div className="font-bold text-xl text-sage-dark flex items-center gap-6">
        <Link href="/">Journal</Link>
        <Link href="/chat" className="text-sm text-sage-muted hover:text-sage-primary font-normal transition-colors">今日觉察</Link>
      </div>
      <div>
        {!loading && (
          <>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">{user.email}</span>
                <button
                  onClick={logout}
                  className="text-sm text-red-500 hover:text-red-700 font-medium"
                >
                  登出
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="text-sm text-sage-dark hover:text-sage-primary font-medium transition-colors"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="text-sm bg-sage-primary text-white px-4 py-1.5 rounded-full hover:bg-sage-dark font-medium transition-colors shadow-sm"
                >
                  注册
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
}
