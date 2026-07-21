"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, BrainCircuit, HeartHandshake, ArrowRight, CheckCircle2, Leaf } from "lucide-react";
import { openWaitlistModal } from "@/components/ui/WaitlistModal";

export default function LandingPage() {
  const router = useRouter();

  const handleStart = () => {
    openWaitlistModal();
  };

  return (
    <div className="min-h-screen bg-background font-sans text-sage-dark selection:bg-sage-primary/20 relative">
      {/* Background decorations wrapped to prevent overflow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sage-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sage-primary/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-24 px-4 sm:px-6 w-full flex flex-col items-center text-center z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage-light/50 border border-sage-light text-sage-dark text-sm font-medium mb-8"
        >
          <Sparkles size={16} className="text-sage-primary" />
          <span>全新上线 · AI 引导式对话日记</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-sage-dark mb-6"
        >
          <span className="text-sage-primary/90">看见自己，更好地成长</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-sage-muted max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          用 AI 引导式对话记录每一天，看清情绪背后的思维模式，练习更自信的表达。每天几分钟，情商在对话中悄悄养成。
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <button 
            onClick={handleStart}
            className="px-8 py-4 bg-sage-primary text-white rounded-full font-medium text-lg hover:bg-sage-dark transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
          >
            申请内测 <ArrowRight size={20} />
          </button>
          <button onClick={(e) => { e.preventDefault(); document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' }); }} className="px-8 py-4 bg-transparent text-sage-dark border border-sage-light rounded-full font-medium text-lg hover:bg-sage-light/50 transition-all">
            了解定价
          </button>
        </motion.div>
        
        {/* Mockup Image - Premium Mac Window Style */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-10 sm:mt-14 w-full max-w-3xl mx-auto relative z-20"
        >
          {/* 强大的发光背景，让界面脱颖而出 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[120%] bg-gradient-to-b from-sage-primary/10 to-sage-primary/20 blur-[80px] rounded-full pointer-events-none -z-10" />
          
          <div className="relative rounded-2xl sm:rounded-[2rem] overflow-hidden bg-white shadow-[0_30px_80px_-15px_rgba(0,0,0,0.15)] border border-sage-light/60 ring-1 ring-black/[0.03]">
            {/* Mac Window Title Bar */}
            <div className="h-10 sm:h-12 bg-white/95 border-b border-sage-light/30 flex items-center px-4 backdrop-blur-md relative z-10">
              <div className="flex gap-2 absolute left-4 sm:left-6">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/30 shadow-sm" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/30 shadow-sm" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/30 shadow-sm" />
              </div>
              
              {/* URL Bar */}
              <div className="flex-1 flex justify-center">
                <div className="bg-sage-50/80 text-sage-muted text-[10px] sm:text-xs font-medium px-4 py-1.5 rounded-md flex items-center gap-2 border border-sage-light/20 shadow-inner">
                  <Leaf size={12} className="text-sage-primary" />
                  hermeticbox.com
                </div>
              </div>
            </div>
            
            {/* The Image */}
            <div className="relative bg-background">
              <img src="/images/hero-mockup.png" alt="觉察 AI 心理对话展示" className="w-full h-auto object-cover block" />
              
              {/* 底部渐变遮罩，让它与下一个区域自然融合 */}
              <div className="absolute inset-x-0 bottom-0 h-32 sm:h-48 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 bg-white/50 w-full">
        <div className="w-full max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-sage-dark mb-5 tracking-tight">看见情绪背后的力量</h2>
            <p className="text-sage-muted text-lg font-medium">结合心理学理论框架，为你设计的三个核心功能</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
            {/* Feature 1 */}
            <div className="bg-white p-8 lg:p-10 rounded-[2rem] border border-sage-light/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 bg-gradient-to-br from-sage-50 to-sage-100/50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-inner border border-sage-light/30">
                <HeartHandshake className="text-sage-primary" size={26} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-sage-dark mb-4">倾听与引导</h3>
              <p className="text-sage-muted/90 leading-loose">不再只是单向的树洞。AI 通过对话耐心倾听，用提问一步步引导你理清思绪，看清自己真正在想什么。</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 lg:p-10 rounded-[2rem] border border-sage-light/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 bg-gradient-to-br from-sage-50 to-sage-100/50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-inner border border-sage-light/30">
                <Sparkles className="text-sage-primary" size={26} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-sage-dark mb-4">日记萃取</h3>
              <p className="text-sage-muted/90 leading-loose">对话结束后，由 AI 提取你的核心情绪和关键洞察，沉淀为一篇结构化的时光日记，形成你的认知资产。</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 lg:p-10 rounded-[2rem] border border-sage-light/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 bg-gradient-to-br from-sage-50 to-sage-100/50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-inner border border-sage-light/30">
                <BrainCircuit className="text-sage-primary" size={26} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-sage-dark mb-4">自由书写</h3>
              <p className="text-sage-muted/90 leading-loose">你可以对日记自由编辑。通过亲自改写，练习更准确地表达情绪。把杂乱的思绪，变成清晰的文字。</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 w-full">
        <div className="text-center mb-16 w-full max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-sage-dark mb-4">按需购买，没有订阅压力</h2>
          <p className="text-sage-muted text-lg font-medium">「一杯咖啡的价格，换一次与内心的深度对话」</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 w-full max-w-5xl mx-auto items-center">
          {/* Tier 1: 体验包 */}
          <div className="bg-white p-8 rounded-[2rem] border border-sage-light shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative z-0">
            <h3 className="text-xl font-bold text-sage-dark mb-2 flex items-center gap-2">🌱 体验包</h3>
            <p className="text-sage-muted text-sm mb-6">先试试看，几乎无负担</p>
            <div className="mb-4">
              <span className="text-4xl font-bold text-sage-dark">$3.99</span>
            </div>
            <div className="text-sm text-sage-dark/90 font-medium mb-8">
              包含 4 滴墨水 (均价 $1.00/次)
            </div>
            <ul className="text-sm text-sage-dark/80 space-y-3 mb-8">
               <li className="flex gap-2 items-center"><CheckCircle2 className="text-sage-primary shrink-0" size={18} /> 1 滴墨水 = 1 篇 AI 专属日记</li>
               <li className="flex gap-2 items-center"><CheckCircle2 className="text-sage-primary shrink-0" size={18} /> 对话不消耗墨水</li>
            </ul>
            <button onClick={openWaitlistModal} className="mt-auto w-full py-3 rounded-full font-medium border-2 border-sage-primary text-sage-primary hover:bg-sage-50 transition-colors">
              申请内测
            </button>
          </div>

          {/* Tier 2: 成长包 (Recommended) */}
          <div className="bg-sage-dark p-8 rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col h-full transform md:scale-105 border border-sage-primary/30 z-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sage-primary/30 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">🌿 成长包</h3>
                <span className="bg-sage-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">最受欢迎</span>
              </div>
              <p className="text-white/70 text-sm mb-6">多数人的选择，适合两周的觉察练习</p>
              <div className="mb-4 flex items-end gap-3">
                <span className="text-4xl font-bold text-white">$9.99</span>
                <span className="bg-white text-sage-dark px-2.5 py-1 rounded-md text-sm font-bold mb-1 shadow-sm">省 17%</span>
              </div>
              <div className="text-sm text-white/90 font-medium mb-8">
                包含 12 滴墨水 (均价 $0.83/次)
              </div>
              <ul className="text-sm text-white/90 space-y-3 mb-8">
                 <li className="flex gap-2 items-center"><CheckCircle2 className="text-sage-primary shrink-0" size={18} /> 1 滴墨水 = 1 篇 AI 专属日记</li>
                 <li className="flex gap-2 items-center"><CheckCircle2 className="text-sage-primary shrink-0" size={18} /> 对话不消耗墨水</li>
              </ul>
              <button onClick={openWaitlistModal} className="mt-auto w-full py-3 rounded-full font-bold bg-sage-primary text-white hover:bg-[#7a9179] transition-colors shadow-lg shadow-sage-primary/20">
                申请内测
              </button>
            </div>
          </div>

          {/* Tier 3: 深耕包 */}
          <div className="bg-white p-8 rounded-[2rem] border border-sage-light shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative z-0">
            <h3 className="text-xl font-bold text-sage-dark mb-2 flex items-center gap-2">🌳 深耕包</h3>
            <p className="text-sage-muted text-sm mb-6">单价最低，适合长期练习</p>
            <div className="mb-4 flex items-end gap-3">
              <span className="text-4xl font-bold text-sage-dark">$19.99</span>
              <span className="bg-sage-primary text-white px-2.5 py-1 rounded-md text-sm font-bold mb-1 shadow-sm">省 34%</span>
            </div>
            <div className="text-sm text-sage-dark/90 font-medium mb-8">
              包含 30 滴墨水 (均价 $0.66/次)
            </div>
            <ul className="text-sm text-sage-dark/80 space-y-3 mb-8">
               <li className="flex gap-2 items-center"><CheckCircle2 className="text-sage-primary shrink-0" size={18} /> 1 滴墨水 = 1 篇 AI 专属日记</li>
               <li className="flex gap-2 items-center"><CheckCircle2 className="text-sage-primary shrink-0" size={18} /> 对话不消耗墨水</li>
            </ul>
            <button onClick={openWaitlistModal} className="mt-auto w-full py-3 rounded-full font-medium border-2 border-sage-primary text-sage-primary hover:bg-sage-50 transition-colors">
              申请内测
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
