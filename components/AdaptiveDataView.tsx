'use client';

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { ChevronDown, Layers } from 'lucide-react';

export interface AdaptiveDataViewProps<T> {
  items: T[];
  pageSize?: number;
  renderTable: (visibleItems: T[]) => React.ReactNode;
  renderCards: (visibleItems: T[]) => React.ReactNode;
  emptyState?: React.ReactNode;
  itemLabel?: string;
  minDesktopWidth?: number;
  className?: string;
}

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function AdaptiveDataView<T>({
  items,
  pageSize = 20,
  renderTable,
  renderCards,
  emptyState,
  itemLabel = 'registros',
  minDesktopWidth = 768,
  className = '',
}: AdaptiveDataViewProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tableWrapperRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Remembers the minimum width the table needed when it last overflowed
  const requiredWidthRef = useRef<number>(0);

  const [useCardLayout, setUseCardLayout] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(pageSize);

  // Reset visibleCount when the item list changes significantly (e.g. search/filter)
  useEffect(() => {
    setVisibleCount((prev) => {
      if (items.length <= pageSize) return pageSize;
      return prev > pageSize ? Math.min(prev, items.length) : pageSize;
    });
    // Re-allow table measurement when data set changes
    requiredWidthRef.current = 0;
  }, [items.length, pageSize]);

  const evaluateLayout = useCallback(() => {
    if (typeof window === 'undefined') return;

    // On mobile screens, always show the current card layout
    if (window.innerWidth < minDesktopWidth) {
      setUseCardLayout(true);
      return;
    }

    const containerEl = containerRef.current;
    if (!containerEl) return;

    const containerWidth = containerEl.clientWidth;
    if (containerWidth <= 0) return;

    const tableWrapperEl = tableWrapperRef.current;
    const tableEl = tableWrapperEl?.querySelector('table');

    if (tableEl) {
      const tableScrollWidth = tableEl.scrollWidth;
      if (tableScrollWidth > containerWidth + 2) {
        requiredWidthRef.current = tableScrollWidth;
        setUseCardLayout(true);
      } else {
        requiredWidthRef.current = tableScrollWidth;
        setUseCardLayout(false);
      }
    } else {
      // Currently rendering cards on desktop because table overflowed earlier;
      // check if container has grown wide enough to try rendering the table again
      if (requiredWidthRef.current > 0 && containerWidth >= requiredWidthRef.current + 4) {
        requiredWidthRef.current = 0;
        setUseCardLayout(false);
      } else if (requiredWidthRef.current === 0) {
        setUseCardLayout(false);
      }
    }
  }, [minDesktopWidth]);

  useIsomorphicLayoutEffect(() => {
    evaluateLayout();
  }, [evaluateLayout, items, visibleCount, useCardLayout]);

  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', evaluateLayout);
      return () => window.removeEventListener('resize', evaluateLayout);
    }

    const observer = new ResizeObserver(() => {
      evaluateLayout();
    });

    observer.observe(containerEl);
    window.addEventListener('resize', evaluateLayout);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', evaluateLayout);
    };
  }, [evaluateLayout]);

  // Lazy loading via IntersectionObserver
  const hasMore = visibleCount < items.length;

  useEffect(() => {
    const sentinelEl = sentinelRef.current;
    if (!sentinelEl || !hasMore || typeof IntersectionObserver === 'undefined') return;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + pageSize, items.length));
        }
      },
      { rootMargin: '240px' }
    );

    io.observe(sentinelEl);
    return () => io.disconnect();
  }, [hasMore, items.length, pageSize]);

  if (items.length === 0) {
    return <>{emptyState || null}</>;
  }

  const visibleItems = items.slice(0, visibleCount);

  return (
    <div ref={containerRef} className={`w-full space-y-3 ${className}`}>
      {useCardLayout ? (
        <div className="w-full">{renderCards(visibleItems)}</div>
      ) : (
        <div
          ref={tableWrapperRef}
          className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
        >
          {renderTable(visibleItems)}
        </div>
      )}

      {/* Sentinel & Lazy Loading Status Footer */}
      {items.length > pageSize && (
        <div
          ref={sentinelRef}
          className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-2.5 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500"
        >
          <div className="flex items-center gap-2 font-semibold">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>
              Mostrando <strong className="text-slate-800 dark:text-slate-200">{visibleItems.length}</strong> de{' '}
              <strong className="text-slate-800 dark:text-slate-200">{items.length}</strong> {itemLabel}
            </span>
          </div>

          {hasMore && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => Math.min(prev + pageSize, items.length))}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <span>
                Cargar más ({Math.min(pageSize, items.length - visibleItems.length)} restantes)
              </span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
