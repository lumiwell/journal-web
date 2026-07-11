import { useState, useEffect } from "react";

export function EditableBlock({ 
  content, 
  onSave, 
  label,
  multiline = true,
  textClassName = "text-base sm:text-lg text-sage-dark",
  placeholder = "点击添加..."
}: { 
  content: string; 
  onSave: (val: string) => void;
  label?: string;
  multiline?: boolean;
  textClassName?: string;
  placeholder?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(content);

  useEffect(() => {
    if (!isEditing) {
      setVal(content);
    }
  }, [content, isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    const trimmed = val.trim();
    setVal(trimmed);
    if (trimmed !== content) {
      onSave(trimmed);
    }
  };

  const containerClasses = `relative group w-full transition-colors duration-300`;

  return (
    <div className={containerClasses}>
      {label && (
        <div className="text-[11px] font-bold tracking-widest text-sage-muted/60 uppercase mb-1.5">
          {label}
        </div>
      )}
      
      <div className="relative w-full">
        {/* Hidden div to drive native height matching exactly */}
        <div className={`invisible whitespace-pre-wrap leading-relaxed ${textClassName} break-words`} aria-hidden="true">
          {(val || placeholder) + (val?.endsWith('\n') ? ' ' : '')}
        </div>
        {/* Absolute textarea overlay - Always present so clicks place cursor natively */}
        <textarea
          className={`absolute top-0 left-0 w-full h-full bg-transparent border-none outline-none ring-0 p-0 m-0 resize-none overflow-hidden leading-relaxed whitespace-pre-wrap break-words ${textClassName} placeholder:text-sage-muted/40 placeholder:italic placeholder:font-normal`}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onFocus={() => setIsEditing(true)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setVal(content);
              e.currentTarget.blur();
            }
            if (!multiline && e.key === 'Enter') {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
