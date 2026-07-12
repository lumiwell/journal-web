import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Mail, Droplets, Download } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteAccount: () => void;
  onExportData: () => void;
  user: { email: string; quota: number } | null;
}

export default function SettingsModal({ isOpen, onClose, onDeleteAccount, onExportData, user }: SettingsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setConfirmEmail(""), 200); // clear after animation
    }
  }, [isOpen]);

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && user && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-sage-dark/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[28px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-white/50 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)]"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-sage-light/20 z-10 bg-white/50">
              <h3 className="text-[17px] font-semibold text-sage-dark tracking-wide">
                账号设置
              </h3>
              <button 
                onClick={onClose}
                className="p-1.5 text-sage-muted hover:text-sage-dark hover:bg-sage-50 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto overscroll-contain pb-safe">
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-sage-50/50 p-4 rounded-2xl border border-sage-light/20">
                  <div className="flex items-center gap-3 text-sage-dark/80">
                    <Mail size={18} />
                    <span className="text-sm font-medium">账号邮箱</span>
                  </div>
                  <span className="text-sm text-sage-dark font-medium">{user.email}</span>
                </div>

                <div className="flex items-center justify-between bg-sage-50/50 p-4 rounded-2xl border border-sage-light/20">
                  <div className="flex items-center gap-3 text-sage-dark/80">
                    <Droplets size={18} />
                    <span className="text-sm font-medium">剩余墨水</span>
                  </div>
                  <span className="text-sm font-bold text-sage-primary">{user.quota} 滴</span>
                </div>

                <div className="flex items-center justify-between bg-sage-50/50 p-4 rounded-2xl border border-sage-light/20">
                  <div className="flex items-center gap-3 text-sage-dark/80">
                    <Download size={18} />
                    <span className="text-sm font-medium">数据管理</span>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onExportData();
                    }}
                    className="text-sm text-sage-primary hover:text-white bg-sage-light/20 hover:bg-sage-primary px-3 py-1.5 rounded-lg font-medium transition-colors border border-sage-primary/20"
                  >
                    导出我的数据
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-6 border-t border-red-100/50">
                <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-4">危险操作区 (Danger Zone)</h4>
                <div className="bg-red-50/50 border border-red-100 p-5 rounded-2xl flex flex-col gap-4">
                  <div>
                    <h5 className="text-sm font-semibold text-red-600">注销账号</h5>
                    <p className="text-[13px] text-red-500/80 mt-1 leading-relaxed">永久删除您的所有日记和数据，无法恢复。请输入 <strong className="font-semibold">{user.email}</strong> 确认注销。</p>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <input
                      type="email"
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      placeholder={user.email}
                      className="w-full px-3 py-2 rounded-xl border border-red-200 bg-white text-sm text-sage-dark focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent placeholder:text-gray-300"
                    />
                    <button
                      onClick={() => {
                        onClose();
                        onDeleteAccount();
                      }}
                      disabled={confirmEmail !== user.email}
                      className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-red-500 rounded-xl text-sm font-medium transition-colors shadow-sm"
                    >
                      <Trash2 size={16} />
                      确认注销
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
