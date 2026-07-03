"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const { user, loading, logout, isExtractingDiary } = useAuth();
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("refresh_diaries"));
      const scrollContainer = document.getElementById("main-scroll-container");
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full h-[70px] bg-white/80 backdrop-blur-md border-b border-sage-light/30 shadow-sm p-4 flex justify-between items-center z-50">
      <div className="font-bold text-xl text-sage-dark flex items-center gap-6 z-10 relative">
        <Link href="/" onClick={handleLogoClick}>Journal</Link>
        <Link href="/chat" className="text-sm text-sage-muted hover:text-sage-primary font-normal transition-colors hidden sm:block">今日觉察</Link>
      </div>

      {/* 全局后台任务进度条 */}
      <AnimatePresence>
        {isExtractingDiary && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none"
          >
              <div className="flex items-center gap-2.5 bg-rose-50/95 border border-rose-200/60 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm">
                <div className="flex gap-1 items-center mt-0.5">
                  <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-rose-500/80"></motion.div>
                  <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-rose-500/80"></motion.div>
                  <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-rose-500/80"></motion.div>
                </div>
                <span className="text-xs font-medium text-rose-700/80 tracking-wide">正在为你封存日记</span>
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="z-10 relative">
        {!loading && (
          <>
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-sage-light/60 border border-sage-light hover:border-sage-primary/50 text-sage-dark font-semibold shadow-sm hover:shadow transition-all cursor-pointer focus:outline-none"
                >
                  {user.email.charAt(0).toUpperCase()}
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-3 w-56 sm:w-64 bg-white/95 backdrop-blur-xl border border-sage-light/40 rounded-2xl shadow-xl py-2 z-50 overflow-hidden transform origin-top-right transition-all">
                    {/* 用户信息展示区 */}
                    <div className="px-4 py-3 border-b border-sage-light/30 flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-sage-light/60 border border-sage-light flex items-center justify-center text-sage-dark text-lg font-bold mb-2">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[14px] text-sage-dark font-medium w-full text-center truncate px-2" title={user.email}>
                        {user.email}
                      </span>
                      <span className="text-[11px] text-sage-muted mt-0.5">当前登录账号</span>
                    </div>

                    {/* 操作区 */}
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          logout();
                        }}
                        className="w-full text-center px-4 py-2.5 text-[14px] text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        退出登录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              !isAuthPage && (
                <div className="flex items-center gap-4">
                  <Link
                    href={`/login?returnTo=${encodeURIComponent(pathname)}`}
                    className="text-sm text-sage-dark hover:text-sage-primary font-medium transition-colors"
                  >
                    登录
                  </Link>
                  <Link
                    href={`/register?returnTo=${encodeURIComponent(pathname)}`}
                    className="text-sm bg-sage-primary text-white px-4 py-1.5 rounded-full hover:bg-sage-dark font-medium transition-colors shadow-sm"
                  >
                    注册
                  </Link>
                </div>
              )
            )}
          </>
        )}
      </div>
    </header>
  );
}
