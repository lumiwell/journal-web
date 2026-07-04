"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";
import GlobalGeneratingIndicator from "./GlobalGeneratingIndicator";

export default function Header() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (pathname === "/chat") {
    return null;
  }

  const avatarLetter = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault();
      const container = document.getElementById("home-scroll-container");
      if (container) {
        container.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full h-[54px] bg-white/80 backdrop-blur-md border-b border-sage-light/30 shadow-sm px-4 py-1.5 flex justify-between items-center z-50">
      <GlobalGeneratingIndicator />
      <div className="font-bold text-xl text-sage-dark flex items-center gap-6">
        <Link href="/" onClick={handleLogoClick}>Journal</Link>
        {/* 移动端隐藏今日觉察 */}
        <Link href="/chat" className="text-sm font-medium text-sage-primary hover:text-sage-dark transition-colors hidden sm:block">
          今日觉察
        </Link>
      </div>
      <div>
        {!loading && (
          <>
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-8 h-8 rounded-full bg-sage-primary text-white font-medium flex items-center justify-center shadow-sm hover:bg-sage-dark transition-colors focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-1"
                >
                  {avatarLetter}
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-sage-light/20 overflow-hidden flex flex-col z-50"
                    >
                      <div className="px-4 py-4 flex flex-col items-center justify-center gap-2 bg-sage-light/10">
                        <div className="w-10 h-10 rounded-full bg-sage-primary text-white text-lg font-medium flex items-center justify-center shrink-0 shadow-sm">
                          {avatarLetter}
                        </div>
                        <span className="text-sm text-sage-dark font-medium truncate w-full text-center" title={user.email}>
                          {user.email}
                        </span>
                      </div>
                      <div className="border-t border-gray-100"></div>
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-center px-4 py-2.5 text-sm text-sage-dark/80 hover:text-sage-dark hover:bg-sage-light/20 font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <LogOut size={16} />
                        退出登录
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
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
