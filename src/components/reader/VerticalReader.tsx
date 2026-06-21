'use client';

import { useEffect, useRef } from 'react';
import { Panel } from '@/types';
import { EpisodeComments } from '@/components/story/EpisodeComments';

interface VerticalReaderProps {
  panels: Panel[];
  onProgressChange: (progress: number) => void;
  initialProgress: number;
  episodeId: string;
}

export function VerticalReader({ panels, onProgressChange, initialProgress, episodeId }: VerticalReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialProgress > 0 && containerRef.current) {
      // Delay slightly to ensure layout and image height calculations are ready
      const timer = setTimeout(() => {
        const element = containerRef.current;
        if (element) {
          const scrollHeight = element.scrollHeight - element.clientHeight;
          if (scrollHeight > 0) {
            element.scrollTop = scrollHeight * initialProgress;
          }
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [initialProgress, panels]);

  const handleScroll = () => {
    const element = containerRef.current;
    if (!element) return;

    const scrollHeight = element.scrollHeight - element.clientHeight;
    if (scrollHeight <= 0) return;

    const progress = element.scrollTop / scrollHeight;
    // Bounds check progress to 0.0 -> 1.0 range
    onProgressChange(Math.min(Math.max(progress, 0), 1));
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto overflow-x-hidden w-full h-[calc(100vh-4rem)] bg-background select-none scroll-smooth flex flex-col items-center"
    >
      <div className="w-full max-w-2xl flex flex-col items-center">
        {panels.map((panel) => (
          <div key={panel.id} className="w-full relative bg-surface/10">
            <img
              src={panel.cdn_url}
              alt={`Panel ${panel.display_order}`}
              className="w-full h-auto object-contain select-none pointer-events-none"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              loading="lazy"
            />
          </div>
        ))}

        {/* Discussion Board at the bottom */}
        <div className="w-full px-4 py-16 bg-background border-t border-border-custom/50">
          <EpisodeComments episodeId={episodeId} />
        </div>
      </div>
    </div>
  );
}

