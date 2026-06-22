'use client';

import { useEffect, useState } from 'react';
import { Panel } from '@/types';
import { useSwipeable } from 'react-swipeable';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalReaderProps {
  panels: Panel[];
  direction: 'ltr' | 'rtl';
  onProgressChange: (pageIndex: number, progress: number) => void;
  initialPage: number;
}

export function HorizontalReader({ panels, direction, onProgressChange, initialPage }: HorizontalReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);

  // Sync initial page from database state
  useEffect(() => {
    if (initialPage >= 0 && initialPage < panels.length) {
      setCurrentPage(initialPage);
    }
  }, [initialPage, panels]);

  const changePage = (index: number) => {
    if (index >= 0 && index < panels.length) {
      setCurrentPage(index);
      const progress = panels.length > 1 ? index / (panels.length - 1) : 1;
      onProgressChange(index, progress);
    }
  };

  const handleNext = () => {
    if (currentPage < panels.length - 1) {
      changePage(currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      changePage(currentPage - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const isLtr = direction === 'ltr';
      
      if (key === 'ArrowRight' || key.toLowerCase() === 'd') {
        isLtr ? handleNext() : handlePrev();
      } else if (key === 'ArrowLeft' || key.toLowerCase() === 'a') {
        isLtr ? handlePrev() : handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, direction, panels]);

  // Swipe gestures
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => direction === 'ltr' ? handleNext() : handlePrev(),
    onSwipedRight: () => direction === 'ltr' ? handlePrev() : handleNext(),
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  const activePanel = panels[currentPage];

  // Tap-based navigation (left/right split)
  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const isLtr = direction === 'ltr';

    // Ignore clicks if clicking near the center overlay controls
    if (x > width * 0.4 && x < width * 0.6) return;

    if (x > width / 2) {
      isLtr ? handleNext() : handlePrev();
    } else {
      isLtr ? handlePrev() : handleNext();
    }
  };

  if (panels.length === 0) return null;

  return (
    <div 
      {...swipeHandlers}
      className="flex-1 flex flex-col items-center justify-center bg-background select-none h-full w-full relative touch-none"
    >
      {/* Immersive page image area */}
      <div 
        onClick={handleScreenClick}
        className="flex-1 h-0 w-full flex items-center justify-center p-4 cursor-pointer relative"
      >
        {activePanel ? (
          <img
            src={activePanel.cdn_url}
            alt={`Panel ${currentPage + 1} of ${panels.length}`}
            className="max-h-full max-w-full object-contain pointer-events-none select-none shadow-2xl transition-all duration-300"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
        ) : (
          <div className="text-text-muted text-caption">No Panel Image</div>
        )}

        {/* Navigation Overlays */}
        <div className="absolute inset-y-0 left-0 w-16 hidden md:flex items-center justify-start pl-4 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300">
          <button className="w-10 h-10 rounded-full bg-black/60 border border-border-custom text-brand-primary flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute inset-y-0 right-0 w-16 hidden md:flex items-center justify-end pr-4 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300">
          <button className="w-10 h-10 rounded-full bg-black/60 border border-border-custom text-brand-primary flex items-center justify-center">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Page Progress HUD */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-black/75 text-caption font-semibold tracking-wider border border-border-custom backdrop-blur-sm select-none text-text-secondary">
        Page {currentPage + 1} / {panels.length}
      </div>
    </div>
  );
}
