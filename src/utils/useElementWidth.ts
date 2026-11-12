import { useEffect, useRef, useState } from 'react';

/**
 * Tracks the rendered content width of an element via ResizeObserver,
 * so SVG charts can rebuild their viewBox to fill the container exactly.
 * Returns [ref, width]; width starts at 0 until the first measurement.
 */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w != null) setWidth(w);
    });
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}
