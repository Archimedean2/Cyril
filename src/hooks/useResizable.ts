import { useState, useCallback, useEffect, useRef } from 'react';

interface ResizableState {
  width: number;
  isResizing: boolean;
}

interface UseResizableOptions {
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
  storageKey?: string;
  direction?: 'right' | 'left';
}

export function useResizable({
  initialWidth,
  minWidth,
  maxWidth,
  storageKey,
  direction = 'right',
}: UseResizableOptions) {
  const [state, setState] = useState<ResizableState>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const width = parseInt(saved, 10);
        if (!isNaN(width) && width >= minWidth && width <= maxWidth) {
          return { width, isResizing: false };
        }
      }
    }
    return { width: initialWidth, isResizing: false };
  });

  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeRef.current = {
      startX: e.clientX,
      startWidth: state.width,
    };
    setState(prev => ({ ...prev, isResizing: true }));
  }, [state.width]);

  const stopResizing = useCallback(() => {
    if (resizeRef.current) {
      resizeRef.current = null;
      setState(prev => {
        if (storageKey) {
          localStorage.setItem(storageKey, String(prev.width));
        }
        return { ...prev, isResizing: false };
      });
    }
  }, [storageKey]);

  const resize = useCallback((e: MouseEvent) => {
    if (!resizeRef.current) return;

    const { startX, startWidth } = resizeRef.current;
    const delta = direction === 'right'
      ? e.clientX - startX
      : startX - e.clientX;
    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + delta));

    setState(prev => ({ ...prev, width: newWidth }));
  }, [minWidth, maxWidth, direction]);

  useEffect(() => {
    if (state.isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [state.isResizing, resize, stopResizing]);

  return {
    width: state.width,
    isResizing: state.isResizing,
    startResizing,
    style: { width: `${state.width}px`, minWidth: `${minWidth}px`, maxWidth: `${maxWidth}px` },
  };
}
