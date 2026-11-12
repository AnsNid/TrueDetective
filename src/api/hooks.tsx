/**
 * 数据获取 Hooks:加载/错误/重试 三态,供各视图复用
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from './client';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * 拉取一次列表/详情类数据(envelope.data 直接返回,失败时 error 带 message)
 */
export function useApiData<T>(
  fetcher: () => Promise<{ code: number; message: string; data: T }>,
  deps: unknown[] = []
): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcherRef
      .current()
      .then((res) => {
        if (cancelled) return;
        if (res.code === 200) {
          setData(res.data);
        } else {
          setError(res.message || '请求失败');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, reload };
}

/**
 * 通用重试按钮 + 错误提示条(沿用工作台视觉风格)
 */
export function LoadErrorBar({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="px-3.5 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[12px] text-amber-700 flex items-center justify-between">
      <span>⚠ {message}</span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="text-xs font-medium underline ml-4 cursor-pointer shrink-0"
        >
          重新加载
        </button>
      ) : null}
    </div>
  );
}

/**
 * 骨架占位(保持卡片式风格)
 */
export function LoadingCards({ rows = 2 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs animate-pulse"
        >
          <div className="h-3 w-40 bg-slate-100 rounded" />
          <div className="h-3 w-3/4 bg-slate-50 rounded mt-2.5" />
        </div>
      ))}
    </div>
  );
}
