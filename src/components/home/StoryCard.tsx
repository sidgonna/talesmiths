'use client';

import Link from 'next/link';
import { Story } from '@/types';
import { BookOpen, Compass, ArrowRight } from 'lucide-react';

interface StoryCardProps {
  story: Story;
}

export function StoryCard({ story }: StoryCardProps) {
  return (
    <Link
      href={`/stories/${story.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border-custom bg-surface hover:border-brand-primary/30 hover:shadow-xl hover:shadow-black/20 transition-all duration-300 h-full"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-background">
        {story.cover_url ? (
          <img
            src={story.cover_url}
            alt={story.title}
            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-text-muted bg-radial-gradient from-surface-hover to-background">
            <BookOpen className="w-12 h-12 text-text-muted mb-2 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-caption font-semibold uppercase tracking-wider text-brand-primary/70">
              {story.title}
            </span>
            <span className="text-caption mt-1">No Cover Available</span>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-black/75 text-brand-primary border border-brand-primary/20 backdrop-blur-sm">
            {story.status}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-black/75 text-text-primary border border-border-custom backdrop-blur-sm">
            {story.read_mode === 'vertical' ? (
              <>
                <Compass className="w-2.5 h-2.5 text-brand-primary" />
                Scroll
              </>
            ) : (
              <>
                <BookOpen className="w-2.5 h-2.5 text-brand-primary" />
                Page
              </>
            )}
          </span>
        </div>
      </div>

      {/* Info details */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-h4 text-brand-primary group-hover:text-brand-dark transition-colors duration-200 line-clamp-1 mb-1.5">
          {story.title}
        </h3>
        
        {story.description && (
          <p className="text-small text-text-secondary line-clamp-3 mb-4 flex-1">
            {story.description}
          </p>
        )}

        {/* Tags and CTA */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border-custom/50">
          <div className="flex flex-wrap gap-1.5 max-w-[70%]">
            {story.genre_tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center text-[11px] text-text-muted px-2 py-0.5 rounded bg-background border border-border-custom"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="inline-flex items-center gap-1 text-[12px] font-bold text-accent-blood-red group-hover:text-accent-hover-crimson transition-colors duration-200">
            Read
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-200" />
          </span>
        </div>
      </div>
    </Link>
  );
}
