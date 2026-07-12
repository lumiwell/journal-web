"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Droplet, MessageCircleHeart } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams?.get('new_user') === 'true') {
      setIsOpen(true);
      
      // Remove query param from URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete('new_user');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl relative z-10 overflow-hidden"
        >
          {/* 装饰背景 */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-sage-light/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-sage-primary/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="w-16 h-16 bg-sage-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-sage-100">
              <Droplets className="text-sage-primary" size={32} />
            </div>
            
            <h3 className="text-xl font-bold text-sage-dark mb-2 tracking-wide">
              注册成功，送你 3 滴墨水
            </h3>
            
            <p className="text-[15px] text-sage-muted mb-8 leading-relaxed">
              欢迎来到这里。为了让你更好地体验完整功能，系统已为你发放了 3 滴初始墨水。
            </p>
            
            <div className="w-full space-y-4 mb-8 bg-sage-50/50 p-5 rounded-2xl border border-sage-100/50">
              <div className="flex items-start gap-3 text-left">
                <MessageCircleHeart className="text-sage-primary mt-0.5 shrink-0" size={18} />
                <div className="text-[14px]">
                  <span className="font-semibold text-sage-dark block mb-0.5">自由交流，不耗墨水</span>
                  <span className="text-sage-muted leading-snug block">你可以随时在此开启对话，毫无负担地表达想法，进行深度的自我探索与觉察。</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left">
                <Droplet className="text-sage-primary mt-0.5 shrink-0" size={18} />
                <div className="text-[14px]">
                  <span className="font-semibold text-sage-dark block mb-0.5">生成日记，消耗墨水</span>
                  <span className="text-sage-muted leading-snug block">只有在对话结束后，你主动点击“生成日记”让 AI 进行萃取总结时，才会消耗 1 滴墨水。</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-3.5 bg-sage-primary hover:bg-sage-dark text-white rounded-2xl font-medium tracking-wide transition-colors shadow-sm"
            >
              我知道了
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
