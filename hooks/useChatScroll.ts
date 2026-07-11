import { useState, useEffect, useRef } from 'react';

export function useChatScroll(
  messages: any[], 
  isInitializing: boolean, 
  status: string, 
  hasReachedTurnLimit: boolean, 
  isLongIdleTime: boolean
) {
  const [viewportHeight, setViewportHeight] = useState('100dvh');
  const [isNavVisible, setIsNavVisible] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInitialScroll = useRef(true);

  // 1. 监听 iOS 虚拟键盘与视口高度变化
  useEffect(() => {
    const updateHeight = () => {
      setViewportHeight(`${window.visualViewport ? window.visualViewport.height : window.innerHeight}px`);
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeight);
    }
    
    return () => {
      window.removeEventListener('resize', updateHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateHeight);
      }
    };
  }, []);

  // 2. 监听滚动以隐藏/显示顶部导航
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let lastScrollY = container.scrollTop;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = container.scrollTop;
          // 当接近底部时，强制显示输入框 (距离底部 80px 以内)
          const isAtBottom = container.clientHeight + currentScrollY >= container.scrollHeight - 80;
          
          if (isAtBottom) {
            setIsNavVisible(true);
          } else if (currentScrollY < lastScrollY - 15) {
            // 向上滚动（看旧消息） -> 隐藏 UI，进入完全沉浸模式
            setIsNavVisible(false);
          } else if (currentScrollY > lastScrollY + 15) {
            // 向下滚动（回到最新消息） -> 浮现 UI
            setIsNavVisible(true);
          }
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // 3. 消息更新时自动滚动到底部
  useEffect(() => {
    if (!isInitializing && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: isInitialScroll.current ? "auto" : "smooth"
      });
      if (isInitialScroll.current) {
        setTimeout(() => {
          isInitialScroll.current = false;
        }, 100);
      }
    }
  }, [messages, isInitializing, viewportHeight, status, hasReachedTurnLimit, isLongIdleTime]);

  return { viewportHeight, isNavVisible, scrollContainerRef };
}
