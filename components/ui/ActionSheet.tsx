import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  zIndexBase?: number; // Optional prop to override default z-index if needed
}

export default function ActionSheet({ 
  isOpen, 
  onClose, 
  children,
  zIndexBase = 110 // Default high z-index (backdrop = zIndexBase, sheet = zIndexBase + 10)
}: ActionSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ zIndex: zIndexBase }}
            className="fixed inset-0 bg-sage-dark/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{ zIndex: zIndexBase + 10 }}
            className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] border-t border-sage-light/30 p-6 pb-[max(2rem,env(safe-area-inset-bottom))]"
          >
            {/* 顶部小药丸 (拖拽指示器) */}
            <div className="w-12 h-1.5 bg-sage-light/80 rounded-full mx-auto mb-8" />
            
            {/* 内容插槽 */}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
