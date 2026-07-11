import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const generationSteps = [
  { title: "正在倾听内心的回音...", subtitle: "安静地深呼吸，那些未言明的思绪，我都懂" },
  { title: "正在抚平纷乱的思绪...", subtitle: "把烦恼交给我，让紧绷的神经稍微休息一下吧" },
  { title: "正在打磨时光的碎片...", subtitle: "我们在字里行间，为你寻找藏在深处的答案" },
  { title: "正在为你凝结日记...", subtitle: "所有的情绪都有它的意义，这份礼物马上就绪" }
];

interface GeneratingOverlayProps {
  isGenerating: boolean;
}

export default function GeneratingOverlay({ isGenerating }: GeneratingOverlayProps) {
  const [generationStepIdx, setGenerationStepIdx] = useState(0);

  useEffect(() => {
    if (isGenerating) {
      setGenerationStepIdx(0);
      const interval = setInterval(() => {
        setGenerationStepIdx(prev => (prev < generationSteps.length - 1 ? prev + 1 : prev));
      }, 3500); // 3.5秒切换一次文案
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  return (
    <AnimatePresence>
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 z-50 bg-white/70 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
        >
          <motion.div
            key="generating"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <div className="flex gap-2 items-center mb-6">
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity, delay: 0 }} className="w-2 h-2 rounded-full bg-sage-primary shadow-[0_0_10px_rgba(163,177,138,0.5)]"></motion.div>
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity, delay: 0.6 }} className="w-2 h-2 rounded-full bg-sage-primary shadow-[0_0_10px_rgba(163,177,138,0.5)]"></motion.div>
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity, delay: 1.2 }} className="w-2 h-2 rounded-full bg-sage-primary shadow-[0_0_10px_rgba(163,177,138,0.5)]"></motion.div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={generationStepIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center px-4"
              >
                <h3 className="text-xl font-medium text-sage-dark mb-3 tracking-wider">{generationSteps[generationStepIdx].title}</h3>
                <p className="text-sm text-sage-muted">{generationSteps[generationStepIdx].subtitle}</p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
