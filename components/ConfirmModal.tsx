import { motion, AnimatePresence } from "framer-motion";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "确认",
  cancelText = "取消",
  onConfirm,
  onCancel,
  isDestructive = true,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-sage-dark/40 backdrop-blur-sm"
            onClick={onCancel}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-[28px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-white/50 overflow-hidden p-6 sm:p-8 text-center"
          >
            <h3 className="text-[17px] font-semibold text-sage-dark mb-3 tracking-wide">
              {title}
            </h3>
            <p className="text-[14px] text-sage-muted/90 mb-8 leading-relaxed px-2 whitespace-pre-wrap">
              {description}
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={onConfirm}
                className={`w-full py-3.5 rounded-2xl text-[15px] font-medium transition-all duration-300 shadow-sm ${
                  isDestructive
                    ? "bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 border border-red-100/50"
                    : "bg-sage-primary text-white hover:bg-sage-dark"
                }`}
              >
                {confirmText}
              </button>
              <button
                onClick={onCancel}
                className="w-full py-3.5 rounded-2xl text-[15px] font-medium text-sage-muted hover:text-sage-dark bg-sage-light/20 hover:bg-sage-light/40 transition-colors"
              >
                {cancelText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
