'use client';

import { useState } from 'react';
import { Story } from '@/types';
import { GenreFilter } from '@/components/home/GenreFilter';
import { StoryCard } from '@/components/home/StoryCard';
import { Compass } from 'lucide-react';

interface StoriesBrowserProps {
  initialStories: Story[];
}

export function StoriesBrowser({ initialStories }: StoriesBrowserProps) {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  // Extract all unique genres across the initial stories list
  const allGenres = Array.from(
    new Set(initialStories.flatMap((story) => story.genre_tags))
  ).sort();

  // Filter stories based on selected genre
  const filteredStories = selectedGenre
    ? initialStories.filter((story) => story.genre_tags.includes(selectedGenre))
    : initialStories;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 mb-8 md:flex-row md:items-center md:justify-between border-b border-border-custom pb-6">
        <div>
          <h2 className="text-h2 text-brand-primary uppercase tracking-wider mb-1">
            Our Collection
          </h2>
          <p className="text-small text-text-secondary">
            Browse through our original AI-generated manga series and webcomics.
          </p>
        </div>
        
        {/* Genre filter controls */}
        <GenreFilter
          genres={allGenres}
          selectedGenre={selectedGenre}
          onSelectGenre={setSelectedGenre}
        />
      </div>

      {/* Stories Grid */}
      {filteredStories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredStories.map((story) => (
            <div key={story.id} className="h-full">
              <StoryCard story={story} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border-custom rounded-2xl bg-surface/50">
          <Compass className="w-12 h-12 text-text-muted mb-4 animate-spin-slow" />
          <h3 className="text-h4 text-brand-primary mb-1">No Stories Found</h3>
          <p className="text-small text-text-secondary max-w-xs">
            We couldn't find any stories matching the selected genre. Try another filter!
          </p>
        </div>
      )}
    </section>
  );
}
