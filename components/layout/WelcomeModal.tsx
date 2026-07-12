"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, ShieldCheck, HeartHandshake } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams?.get('new_user') === 'true') {
      setIsOpen(true);
      setStep(1);
      
      // Remove query param from URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete('new_user');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsOpen(false);
    }
  };

  const slides = [
    {
      id: 1,
      icon: <ShieldCheck className="text-sage-primary" size={32} />,
      title: "隐私与安全",
      content: (
        <p className="text-[15px] text-sage-muted leading-relaxed">
          您的倾诉仅属于您自己。数据全程加密传输与存储，<strong className="text-sage-dark font-semibold">绝不出售，也绝不用于训练 AI 模型</strong>。您拥有 100% 的数据自主权，可随时在设置中一键彻底销毁。
        </p>
      )
    },
    {
      id: 2,
      icon: <HeartHandshake className="text-sage-primary" size={32} />,
      title: "产品定位与免责声明",
      content: (
        <p className="text-[15px] text-sage-muted leading-relaxed">
          这是一个由 AI 驱动的<strong className="text-sage-dark font-semibold">情绪梳理和自我觉察工具</strong>，旨在帮助您深度反思并获得持续的自我成长。请注意，它<strong className="text-red-400 font-semibold">不能替代专业的心理咨询或医疗诊断</strong>。如遇严重的心理危机，请务必及时寻求专业医疗帮助。
        </p>
      )
    },
    {
      id: 3,
      icon: <Droplets className="text-sage-primary" size={32} />,
      title: "玩法说明与新人礼包",
      content: (
        <div className="text-[15px] text-sage-muted leading-relaxed space-y-3">
          <p>
            在完成对话后，您可以将它生成为一篇基于<strong className="text-sage-dark font-semibold">认知心理学原理</strong>的<strong className="text-sage-dark font-semibold">自我觉察日记</strong>。
          </p>
          <p>
            AI 会为您生成包含“情绪、身体感受、事实与新视角”的结构化草稿，您可以自由且无感地编辑它，以此来精准重塑当日的思绪，完成真正的复盘与成长。
          </p>
          <div className="bg-sage-50/80 p-3 rounded-xl border border-sage-100/50 mt-4 text-sm text-sage-dark font-medium text-center">
            每次生成日记将消耗 1 滴墨水。<br/>
            我们已<span className="text-sage-primary font-bold">赠送您 3 滴墨水</span>，快去体验吧！
          </div>
        </div>
      )
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
        {/* Only allow closing on click outside if we are on the final step, to force reading */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-sage-dark/40 backdrop-blur-sm"
          onClick={() => {
            if (step === 3) setIsOpen(false);
          }}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl relative z-10 overflow-hidden max-h-[calc(100dvh-2rem)] flex flex-col"
        >
          {/* Decorative background */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-sage-light/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-sage-primary/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col flex-1 overflow-y-auto overflow-x-hidden p-8">
            <div className="flex-1 relative flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center pt-2 flex-1"
              >
                <div className="w-16 h-16 bg-sage-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-sage-100 shrink-0">
                  {slides[step - 1].icon}
                </div>
                
                <h3 className="text-[19px] font-bold text-sage-dark mb-5 tracking-wide shrink-0">
                  {slides[step - 1].title}
                </h3>
                
                <div className="text-left w-full flex-1">
                  {slides[step - 1].content}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-auto pt-6 z-10 flex flex-col items-center gap-6 shrink-0">
            {/* Dots */}
            <div className="flex gap-2">
              {[1, 2, 3].map((s) => (
                <div 
                  key={s} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? "w-6 bg-sage-primary" : "w-2 bg-gray-200"}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3.5 bg-sage-primary hover:bg-sage-dark text-white rounded-2xl font-medium tracking-wide transition-colors shadow-sm"
            >
              {step === 3 ? "开始对话" : "下一步"}
            </button>
          </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
