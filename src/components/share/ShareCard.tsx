'use client';

import { Story, Episode } from '@/types';
import { Sparkles } from 'lucide-react';

interface ShareCardProps {
  story: Story;
  episode?: Episode;
  cardRef: React.RefObject<HTMLDivElement | null>;
}

export function ShareCard({ story, episode, cardRef }: ShareCardProps) {
  const coverUrl = story.cover_url || '/images/mahakala_cover.png';
  const displayTitle = episode 
    ? (episode.title ? `Ep ${episode.episode_number}: ${episode.title}` : `Episode ${episode.episode_number}`)
    : story.title;
    
  const displaySubtitle = episode 
    ? `Chapter release from ${story.title}` 
    : (story.description || 'Explore original series on Tale Smiths.');

  return (
    /* Standard 1200x630 ratio container for downloading. We use responsive classes to scale it inside the modal */
    <div className="w-full max-w-[480px] overflow-hidden rounded-xl border border-border-custom shadow-2xl bg-background aspect-[1200/630] select-none">
      {/* Target element for html-to-image capture. Must be 1200x630 absolute size during capture to yield crisp resolution, but scaled down visually */}
      <div
        ref={cardRef}
        className="w-[1200px] h-[630px] flex flex-col justify-end p-12 bg-coal-black relative origin-top-left scale-[0.4] sm:scale-[0.35] md:scale-[0.4] select-none pointer-events-none"
        style={{
          width: '1200px',
          height: '630px',
          backgroundImage: `url(${coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark legibility gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/30 z-0" />

        {/* Wordmark top-left */}
        <div className="absolute top-10 left-12 flex items-center z-10">
          <span className="text-h3 font-bebas text-brand-primary tracking-widest uppercase">
            Tale Smiths
          </span>
        </div>

        {/* Badges */}
        <div className="relative z-10 flex items-center gap-1.5 px-3 py-1 rounded bg-black/55 border border-brand-primary/20 text-[12px] font-bold text-brand-primary uppercase tracking-wider mb-4 w-fit">
          <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
          {episode ? 'New Episode' : `Original Series • ${story.status}`}
        </div>

        {/* Title */}
        <h2 className="text-[72px] font-bebas text-text-primary leading-[0.9] tracking-wider uppercase z-10 mb-4 truncate w-full">
          {displayTitle}
        </h2>

        {/* Description/Subtitle */}
        <p className="text-[20px] text-text-secondary line-clamp-2 max-w-[850px] leading-relaxed mb-6 z-10">
          {displaySubtitle}
        </p>

        {/* Footer Actions Row */}
        <div className="relative z-10 flex items-center justify-between w-full pt-4 border-t border-border-custom/30">
          <span className="text-[16px] text-text-muted">
            {episode ? 'Now available to read free.' : 'Read vertical scroll & page formats.'}
          </span>
          
          <div className="px-6 py-3 rounded-lg bg-accent-blood-red text-text-primary text-[16px] font-bold uppercase tracking-wider">
            Read Now
          </div>
        </div>
      </div>
      
      {/* Outer sizing spacer to match the scaled ref container */}
      <div className="h-[252px] sm:h-[220px] md:h-[252px] w-full" />
    </div>
  );
}
