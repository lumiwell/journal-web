"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Droplets, Download, Trash2, AlertTriangle, Settings, Leaf, Book } from "lucide-react";
import SettingsModal from "@/components/ui/SettingsModal";
import GlobalGeneratingIndicator from "./GlobalGeneratingIndicator";

import { fetchWithAuth } from "@/lib/api";

export default function Header() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

  const handleExportData = async () => {
    try {
      const res = await fetchWithAuth("/api/v1/users/me/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "my_hermeticbox_data.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert("导出失败，请稍后重试");
      }
    } catch (e) {
      alert("导出发生错误");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetchWithAuth("/api/v1/users/me", { method: "DELETE" });
      if (res.ok) {
        logout();
      } else {
        alert("注销失败，请稍后重试");
      }
    } catch (e) {
      alert("注销发生错误");
    }
  };

  if (pathname === "/chat" || pathname?.startsWith("/diary/")) {
    return null;
  }

  const avatarLetter = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault();
      // 使用 Next.js 的 router.replace 清理 hash，并通过 scroll: false 阻止它的自动滚动干扰
      router.replace("/", { scroll: false });
      // 恢复平滑滚动，现在由于加上了 scroll: false，它不会再被 Next.js 中途打断了
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    if (pathname === "/") {
      e.preventDefault();
      router.replace(`/${hash}`, { scroll: false });
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
      setIsDropdownOpen(false); // 在移动端点击后关闭菜单
    }
  };

  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <header className="fixed top-0 left-0 w-full h-[54px] bg-white/80 backdrop-blur-md border-b border-sage-light/30 shadow-sm z-50 px-4 sm:px-6">
      <div className="w-full max-w-5xl mx-auto flex justify-between items-center h-full relative">
        <GlobalGeneratingIndicator />
        <div className="font-bold text-xl text-sage-dark flex items-center gap-6">
        {pathname.startsWith("/diary/") ? (
           <Link href="/" className="text-sage-muted hover:text-sage-dark transition-colors flex items-center justify-center p-2 -ml-2 rounded-full hover:bg-black/5">
             <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
           </Link>
        ) : (
           <Link href="/" onClick={handleLogoClick} className="flex items-center gap-1.5">
             <Leaf size={22} className="text-sage-primary" />
             <span>觉察</span>
           </Link>
        )}
        {/* 移动端隐藏该按钮 */}
        {user ? (
          <Link href="/journal" className="text-sm font-medium text-sage-primary hover:text-sage-dark transition-colors hidden sm:block">
            进入日记
          </Link>
        ) : !isAuthPage ? (
          <div className="hidden sm:flex items-center gap-6 ml-4">
            <Link href="/#features" onClick={(e) => handleNavClick(e, "#features")} className="text-sm font-medium text-sage-dark hover:text-sage-primary transition-colors px-2 py-1">
              特性
            </Link>
            <Link href="/#pricing" onClick={(e) => handleNavClick(e, "#pricing")} className="text-sm font-medium text-sage-dark hover:text-sage-primary transition-colors px-2 py-1">
              定价
            </Link>
          </div>
        ) : null}
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
                      <div className="px-4 py-3 flex justify-between items-center bg-sage-50/50">
                        <span className="text-[13px] text-sage-dark/80 font-medium">剩余墨水</span>
                        <div className="flex items-center gap-1.5 text-sage-primary">
                          <Droplets size={14} />
                          <span className="text-[14px] font-bold">{user.quota} 滴</span>
                        </div>
                      </div>
                      <div className="border-t border-gray-100"></div>
                      <div className="py-1">
                        {/* 移动端专用的“进入日记”入口 */}
                        <Link
                          href="/journal"
                          onClick={() => setIsDropdownOpen(false)}
                          className="sm:hidden px-4 py-2.5 text-sage-dark hover:bg-sage-50 transition-colors flex items-center gap-3 font-medium text-sm text-sage-dark/80 hover:text-sage-dark"
                        >
                          <Book size={16} />
                          日记本
                        </Link>
                        

                        <Link
                          href="/#pricing"
                          onClick={(e) => {
                            handleNavClick(e, "#pricing");
                            setIsDropdownOpen(false);
                          }}
                          className="block px-4 py-2 text-sage-dark hover:bg-sage-50 transition-colors flex items-center gap-3 font-medium text-sm text-sage-dark/80 hover:text-sage-dark"
                        >
                          <Droplets size={16} />
                          补充墨水
                        </Link>
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setIsSettingsOpen(true);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-sage-dark/80 hover:text-sage-dark hover:bg-sage-light/20 font-medium transition-colors flex items-center gap-3"
                        >
                          <Settings size={16} />
                          账号设置
                        </button>

                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            logout();
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-sage-dark/80 hover:text-sage-dark hover:bg-sage-light/20 font-medium transition-colors flex items-center gap-3"
                        >
                          <LogOut size={16} />
                          退出登录
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : !isAuthPage ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="text-sm font-medium text-sage-dark hover:text-sage-primary transition-colors"
                >
                  登录
                </Link>
                <button
                  onClick={() => router.push("/chat")}
                  className="bg-sage-dark text-white px-5 py-2 rounded-full font-medium hover:bg-sage-dark/90 transition-colors shadow-sm text-sm"
                >
                  免费开始
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDeleteAccount={handleDeleteAccount}
        onExportData={handleExportData}
        user={user}
      />
    </header>
  );
}
