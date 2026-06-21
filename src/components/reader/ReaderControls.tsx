'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Share2 } from 'lucide-react';
import { Episode, Story } from '@/types';
import { useState, useEffect } from 'react';
import { ShareModal } from '@/components/share/ShareModal';

interface ReaderControlsProps {
  story: Story;
  currentEpisode: Episode;
  allEpisodes: Episode[];
  progress: number;
  visible: boolean;
  onToggleVisibility: () => void;
}

export function ReaderControls({
  story,
  currentEpisode,
  allEpisodes,
  progress,
  visible,
  onToggleVisibility
}: ReaderControlsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const sorted = [...allEpisodes].sort((a, b) => a.episode_number - b.episode_number);
  const currentIndex = sorted.findIndex((e) => e.id === currentEpisode.id);
  const prevEp = currentIndex > 0 ? sorted[currentIndex - 1] : null;
  const nextEp = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Error enabling fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const getPercentageString = () => {
    return `${Math.round(progress * 100)}%`;
  };

  return (
    <>
      {/* Top Floating Controls Header */}
      <div
        className={`fixed top-0 left-0 right-0 z-30 flex h-16 items-center justify-between border-b border-border-custom bg-background/95 backdrop-blur-md px-4 transition-all duration-300 ease-in-out ${
          visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <Link
            href={`/stories/${story.slug}`}
            className="p-2 rounded-lg bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border-custom transition-all duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-small font-bold text-brand-primary uppercase truncate max-w-[150px] sm:max-w-[200px]">
              {story.title}
            </h1>
            <p className="text-[11px] text-text-secondary truncate max-w-[150px] sm:max-w-[200px]">
              {currentEpisode.title ? `Ep ${currentEpisode.episode_number}: ${currentEpisode.title}` : `Episode ${currentEpisode.episode_number}`}
            </p>
          </div>
        </div>

        {/* Viewport controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsShareOpen(true)}
            className="p-2 rounded-lg bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border-custom transition-all duration-200 cursor-pointer"
            aria-label="Share episode"
          >
            <Share2 className="w-4 h-4 text-brand-primary" />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border-custom transition-all duration-200"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Bottom Floating Navigation Panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-30 flex flex-col border-t border-border-custom bg-background/95 backdrop-blur-md px-4 py-3 gap-2.5 transition-all duration-300 ease-in-out ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Indicator HUD */}
        <div className="w-full flex items-center gap-3 px-2">
          <div className="flex-1 h-1.5 rounded-full bg-surface border border-border-custom/50 overflow-hidden">
            <div
              className="h-full bg-brand-primary transition-all duration-200"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-text-secondary w-8 text-right select-none">
            {getPercentageString()}
          </span>
        </div>

        {/* Bottom controls buttons */}
        <div className="flex items-center justify-between gap-4">
          {prevEp ? (
            <Link
              href={`/stories/${story.slug}/${prevEp.slug}`}
              className="flex-1 inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-lg border border-border-custom bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary text-caption font-semibold transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev Episode
            </Link>
          ) : (
            <button
              disabled
              className="flex-1 inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-lg border border-border-custom bg-surface/30 text-text-muted text-caption font-semibold cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              First Episode
            </button>
          )}

          <button
            onClick={onToggleVisibility}
            className="px-4 py-2.5 text-caption font-bold text-brand-primary bg-surface/50 border border-border-custom rounded-lg hover:bg-surface-hover transition-colors hidden sm:block select-none"
          >
            Hide Controls
          </button>

          {nextEp ? (
            <Link
              href={`/stories/${story.slug}/${nextEp.slug}`}
              className="flex-1 inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-lg bg-accent-blood-red hover:bg-accent-hover-crimson text-text-primary text-caption font-semibold transition-all duration-200 shadow-lg shadow-accent-blood-red/10 focus:outline-none focus:ring-2 focus:ring-accent-blood-red/50"
            >
              Next Episode
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href={`/stories/${story.slug}`}
              className="flex-1 inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-lg border border-brand-primary/20 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-caption font-semibold transition-all duration-200"
            >
              Back to Story
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
      
      {/* Dynamic Episode Share Modal */}
      <ShareModal
        story={story}
        episode={currentEpisode}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </>
  );
}
