'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);
  const y = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Transform pull distance to rotation
  const rotate = useTransform(y, [0, threshold], [0, 360]);

  // Transform pull distance to opacity
  const opacity = useTransform(y, [0, threshold], [0, 1]);

  // Check if user is at the top of the page
  useEffect(() => {
    const checkScroll = () => {
      setCanPull(window.scrollY === 0);
    };

    window.addEventListener('scroll', checkScroll);
    checkScroll();

    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const pullDistance = info.offset.y;

    if (pullDistance > threshold && canPull && !isRefreshing) {
      setIsRefreshing(true);

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        y.set(0);
      }
    } else {
      y.set(0);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10"
        style={{ opacity }}
      >
        <motion.div
          className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg"
          style={{ y: useTransform(y, [0, threshold * 2], [-50, 0]) }}
        >
          <motion.div style={{ rotate }}>
            <RefreshCw className="w-5 h-5 text-primary" />
          </motion.div>
          <span className="text-sm font-medium text-gray-700">
            {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
          </span>
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        drag={canPull && !isRefreshing ? 'y' : false}
        dragConstraints={{ top: 0, bottom: threshold * 1.5 }}
        dragElastic={0.3}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className="touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
