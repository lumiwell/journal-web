import { Droplet } from 'lucide-react';
import ActionSheet from '@/components/ui/ActionSheet';
import { useAuth } from '@/context/AuthContext';

interface ChatActionSheetProps {
  showActionSheet: boolean;
  setShowActionSheet: (val: boolean) => void;
  canGenerate: boolean;
  hasUnprocessed: boolean;
  handleGenerateDiary: (isFromCurtain: boolean) => void;
  sessionId: string;
  setErrorMsg: (msg: string) => void;
  messages: any[];
}

export default function ChatActionSheet({
  showActionSheet,
  setShowActionSheet,
  handleGenerateDiary,
  setErrorMsg,
  messages
}: ChatActionSheetProps) {
  const { user } = useAuth();
  const hasQuota = user ? user.quota > 0 : true; // Guest users might have limits handled by backend

  return (
    <ActionSheet 
      isOpen={showActionSheet} 
      onClose={() => setShowActionSheet(false)}
      zIndexBase={60} // Keep original z-index context for ChatUI
    >
      <div className="max-w-md mx-auto flex justify-center px-2">
              <button
                type="button"
                onClick={() => {
                  if (user !== null && !hasQuota) {
                    setErrorMsg("墨水已耗尽");
                    setShowActionSheet(false);
                  } else {
                    handleGenerateDiary(false);
                    setShowActionSheet(false);
                  }
                }}
                className="flex flex-col items-center gap-2 group w-[60px]"
              >
                <div className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center shadow-sm transition-colors bg-sage-50 text-sage-primary group-hover:bg-sage-100">
                  <Droplet size={24} />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[13px] font-medium text-sage-dark flex items-center gap-1">
                    生成日记
                  </span>
                </div>
              </button>
            </div>
            
            <div className="max-w-md mx-auto mt-6 space-y-4">
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => {
                    setShowActionSheet(false);
                    
                    let exportText = "";
                    let roundCount = 0;

                    messages.forEach((msg) => {
                      const partsText = msg.parts && msg.parts.length > 0
                        ? msg.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join("")
                        : ((msg as any).content || "");
                        
                      if (!partsText.trim()) return;
                        
                      if (msg.role === "user") {
                        roundCount++;
                        if (roundCount > 1) exportText += "\n";
                        exportText += `## 第${roundCount}轮\n用户：${partsText}\n`;
                      } else if (msg.role === "assistant") {
                        if (roundCount === 0) {
                          roundCount++;
                          exportText += `## 第${roundCount}轮\n`;
                        }
                        exportText += `\n回复：\n${partsText}\n\n`;
                      }
                    });

                    navigator.clipboard.writeText(exportText.trim())
                      .then(() => alert("【开发者工具】对话记录复制成功！"))
                      .catch(() => alert("复制失败"));
                  }}
                  className="w-full py-4 text-[14px] font-medium text-sage-primary/80 bg-sage-50/50 rounded-2xl hover:bg-sage-100/50 transition-colors border border-sage-200/50"
                >
                  👨‍💻 [内部] 导出本局对话供调优
                </button>
              )}

              <button
                onClick={() => setShowActionSheet(false)}
                className="w-full py-4 text-[15px] font-medium text-sage-muted hover:text-sage-dark transition-colors"
              >
                取消
              </button>
            </div>
    </ActionSheet>
  );
}
