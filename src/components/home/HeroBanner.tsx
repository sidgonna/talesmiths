'use client';

import Link from 'next/link';
import { Story } from '@/types';
import { Sparkles, ArrowRight, Compass, BookOpen } from 'lucide-react';

interface HeroBannerProps {
  featuredStory: Story | null;
}

export function HeroBanner({ featuredStory }: HeroBannerProps) {
  if (!featuredStory) return null;

  return (
    <section className="relative w-full overflow-hidden border-b border-border-custom bg-surface py-20 md:py-32">
      {/* Background Graphic elements */}
      {featuredStory.cover_url ? (
        <div className="absolute inset-0 z-0">
          <img
            src={featuredStory.cover_url}
            alt=""
            className="w-full h-full object-cover object-center opacity-15 filter blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent hidden md:block" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-radial-gradient from-brand-primary/5 via-transparent to-transparent pointer-events-none" />
      )}

      {/* Content wrapper */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl flex flex-col items-start gap-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-background border border-border-custom text-[11px] text-accent-blood-red uppercase tracking-wider font-semibold rounded-md">
            <Sparkles className="w-3.5 h-3.5 text-accent-blood-red animate-pulse" />
            Featured Release
          </div>

          <h1 className="text-h1 text-brand-primary leading-tight tracking-tight select-none mt-2 break-words">
            {featuredStory.title}
          </h1>

          {featuredStory.description && (
            <p className="text-body-large text-text-secondary line-clamp-4 leading-relaxed mt-2">
              {featuredStory.description}
            </p>
          )}

          {/* Metadata information */}
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <div className="flex gap-2">
              {featuredStory.genre_tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-text-secondary bg-background border border-border-custom rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>

            <span className="inline-flex items-center gap-1 text-small text-text-muted">
              {featuredStory.read_mode === 'vertical' ? (
                <>
                  <Compass className="w-4 h-4 text-accent-blood-red" />
                  Vertical Scroll
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 text-accent-blood-red" />
                  Horizontal Page-flip
                </>
              )}
            </span>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full sm:w-auto">
            <Link
              href={`/stories/${featuredStory.slug}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent-blood-red hover:bg-accent-hover-crimson text-text-primary text-small font-semibold tracking-wider uppercase transition-all duration-200 rounded-lg shadow-lg shadow-accent-blood-red/20 hover:-translate-y-0.5 focus:outline-none"
            >
              Start Reading
              <ArrowRight className="w-4 h-4" />
            </Link>
            <span className="inline-flex items-center justify-center gap-2 px-5 py-3 text-small uppercase font-semibold tracking-wider text-text-secondary border border-border-custom bg-background rounded-lg select-none">
              {featuredStory.status}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
