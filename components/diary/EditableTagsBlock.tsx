import React, { useState, useEffect, useRef } from "react";

export function getTagStyles(val: string, type: 'neutral' | 'emotion', isEmpty: boolean) {
  if (type === 'neutral') {
    if (isEmpty) return { wrapper: "bg-sage-dark/[0.015] text-sage-muted/70 border-sage-dark/[0.03] cursor-text", dot: "bg-sage-muted/30" };
    return { wrapper: "bg-sage-dark/[0.03] text-sage-dark/85 border-sage-dark/5 hover:bg-sage-dark/[0.05]", dot: "bg-sage-primary/50" };
  }
  
  if (isEmpty) return { wrapper: "bg-orange-50/30 text-orange-400 border-orange-100/50 cursor-text", dot: "bg-orange-200" };
  
  const text = val || "";
  if (/焦虑|紧张|生气|愤怒|烦躁|抓狂/.test(text)) return { wrapper: "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100", dot: "bg-rose-400" };
  if (/悲伤|难过|忧郁|抑郁|失落|委屈|孤单/.test(text)) return { wrapper: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100", dot: "bg-blue-400" };
  if (/害怕|恐惧|担忧|恐慌/.test(text)) return { wrapper: "bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100", dot: "bg-purple-400" };
  if (/厌恶|恶心|讨厌|抗拒/.test(text)) return { wrapper: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100", dot: "bg-emerald-400" };
  if (/开心|喜悦|兴奋|快乐|期待|幸福/.test(text)) return { wrapper: "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100", dot: "bg-amber-400" };
  
  return { wrapper: "bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100", dot: "bg-orange-400" };
}

export function EditableTag({ 
  initialValue, 
  onUpdate, 
  onRemove,
  onSplit,
  autoFocus = false,
  isEmptyFallback = false,
  emptyFallbackText = "点击添加",
  type = "neutral"
}: { 
  initialValue: string; 
  onUpdate: (val: string) => void; 
  onRemove: () => void;
  onSplit?: (left: string, right: string) => void;
  autoFocus?: boolean;
  isEmptyFallback?: boolean;
  emptyFallbackText?: string;
  type?: 'neutral' | 'emotion';
}) {
  const [val, setVal] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  const handleBlur = () => {
    const trimmed = val.trim();
    if (!trimmed && !isEmptyFallback) {
      onRemove();
    } else if (trimmed !== initialValue) {
      onUpdate(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 忽略输入法正在组合输入（打中文拼音选词）时的按键事件
    if (e.nativeEvent.isComposing) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
    if (e.key === 'Escape') {
      setVal(initialValue);
      e.currentTarget.blur();
    }
    if (e.key === ' ' && onSplit) {
      e.preventDefault();
      const cursor = inputRef.current?.selectionStart || 0;
      const left = val.slice(0, cursor).trim();
      const right = val.slice(cursor).trim();
      
      // 绝对禁止在没有实质内容的情况下裂变（防止无限生成空标签）
      if (!left && !right) return;
      
      onSplit(left, right);
    }
  };

  const displayVal = val || (isEmptyFallback ? emptyFallbackText : " ");
  const styles = getTagStyles(val, type, isEmptyFallback && !val);

  return (
    <span className={`relative inline-flex items-center gap-1 px-1.5 py-0 rounded-full border transition-all group ${styles.wrapper}`}>
      <span className={`w-1 h-1 rounded-full shrink-0 ${styles.dot}`} />
      <span className="relative inline-flex items-center min-w-[10px]">
        {/* Invisible span purely for width calculation */}
        <span className={`invisible whitespace-pre ${isEmptyFallback && !val ? 'italic text-[12px]' : ''}`} aria-hidden="true">
          {displayVal}
        </span>
        
        {/* Visible text layer when not editing (especially for placeholders) */}
        {isEmptyFallback && !val && (
          <span className="absolute inset-0 flex items-center text-[12px] italic pointer-events-none whitespace-nowrap">
            {emptyFallbackText}
          </span>
        )}
        
        <input
          ref={inputRef}
          className={`absolute inset-0 w-full h-full bg-transparent border-none outline-none ring-0 p-0 m-0 text-inherit text-[12px] ${isEmptyFallback && !val ? "opacity-0 focus:opacity-100" : ""}`}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      </span>
    </span>
  );
}

export function EditableTagsBlock({ 
  tags, 
  onSave, 
  type = "neutral",
  emptyFallbackText = "点击添加"
}: { 
  tags: string[], 
  onSave: (tags: string[]) => void,
  type?: 'neutral' | 'emotion',
  emptyFallbackText?: string
}) {
  const [internalTags, setInternalTags] = useState(tags);
  const [autoFocusIdx, setAutoFocusIdx] = useState<number | null>(null);

  useEffect(() => {
    setInternalTags(prev => {
      const validParentTags = tags.filter(t => t.trim().length > 0).join(",");
      const validInternalTags = prev.filter(t => t.trim().length > 0).join(",");
      if (validParentTags !== validInternalTags) {
        return tags;
      }
      return prev;
    });
  }, [tags]);

  const updateTag = (index: number, newVal: string) => {
    const next = [...internalTags];
    next[index] = newVal;
    setInternalTags(next);
    onSave(next.filter(t => t.trim().length > 0));
  };

  const removeTag = (index: number) => {
    const next = [...internalTags];
    next.splice(index, 1);
    setInternalTags(next);
    onSave(next.filter(t => t.trim().length > 0));
  };

  const handleSplit = (index: number, left: string, right: string) => {
    const next = [...internalTags];
    next.splice(index, 1, left, right);
    setInternalTags(next);
    onSave(next.filter(t => t.trim().length > 0));
    
    if (!left && right) {
      setAutoFocusIdx(index);
    } else {
      setAutoFocusIdx(index + 1);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {internalTags.length > 0 ? (
        internalTags.map((tag, i) => (
          <EditableTag 
            key={`${tag}-${i}`} 
            initialValue={tag} 
            autoFocus={autoFocusIdx === i}
            onUpdate={(val) => updateTag(i, val)} 
            onRemove={() => removeTag(i)} 
            onSplit={(left, right) => handleSplit(i, left, right)}
            type={type}
            emptyFallbackText={emptyFallbackText}
          />
        ))
      ) : (
        <EditableTag 
          initialValue="" 
          isEmptyFallback={true}
          emptyFallbackText={emptyFallbackText}
          type={type}
          autoFocus={autoFocusIdx === 0}
          onUpdate={(val) => {
            const next = [val];
            setInternalTags(next);
            onSave(next.filter(t => t.trim().length > 0));
          }} 
          onRemove={() => {}} 
          onSplit={(left, right) => handleSplit(0, left, right)}
        />
      )}
    </div>
  );
}
