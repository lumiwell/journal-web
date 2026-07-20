"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();

  // 隐藏 Footer 的页面：日记历史、对话流等应用界面，以及法律条款页面
  const hiddenPaths = ["/chat", "/privacy-policy", "/terms-of-service", "/refund-policy"];
  if (hiddenPaths.includes(pathname || "") || pathname?.startsWith("/diary/") || pathname?.startsWith("/journal")) {
    return null;
  }

  return (
    <footer className="w-full bg-white border-t border-sage-light/40 py-12 px-4 sm:px-6 mt-auto z-10 relative">
      <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        
        <div className="flex flex-col items-center md:items-start gap-2">
          <Link href="/" className="flex items-center gap-1.5 text-sage-dark font-medium opacity-80 hover:opacity-100 transition-opacity">
            <Leaf size={18} className="text-sage-primary" />
            <span>觉察</span>
          </Link>
          <p className="text-sm text-sage-muted">
            &copy; {new Date().getFullYear()} 觉察. 保留所有权利。
          </p>
          <p className="text-xs text-sage-muted/70">
            联系我们: <a href="mailto:support@hermeticbox.com" className="hover:text-sage-dark transition-colors">support@hermeticbox.com</a>
          </p>
          <p className="text-[11px] text-sage-muted/50 mt-1 max-w-[280px] md:max-w-[400px] text-center md:text-left leading-relaxed">
            *觉察是一款自我成长与情绪表达工具，非医疗或心理治疗服务。
          </p>
        </div>

        <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 text-sm text-sage-muted font-medium">
          <Link href="/privacy-policy" className="hover:text-sage-dark transition-colors">
            隐私政策
          </Link>
          <Link href="/terms-of-service" className="hover:text-sage-dark transition-colors">
            服务条款
          </Link>
          <Link href="/refund-policy" className="hover:text-sage-dark transition-colors">
            退款政策
          </Link>
        </div>
      </div>
    </footer>
  );
}
