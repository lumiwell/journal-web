"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="w-full bg-white border-b border-gray-100 shadow-sm p-4 flex justify-between items-center z-10 relative">
      <div className="font-bold text-xl text-gray-800 flex items-center gap-6">
        <Link href="/">Journal</Link>
        <Link href="/history" className="text-sm text-gray-500 hover:text-gray-900 font-normal">历史日记</Link>
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
              <div className="flex gap-4">
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700 font-medium"
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
