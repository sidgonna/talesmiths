'use client';

import { useState, useEffect, useTransition, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, X, Compass, Tag, BookOpen } from 'lucide-react';
import { Story } from '@/types';
import { StoryCard } from '@/components/home/StoryCard';

interface SearchContainerProps {
  initialStories: Story[];
}

function SearchContent({ initialStories }: SearchContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // State initialized from URL params if present
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(searchParams.get('genre') || null);

  // Extract all unique genres across stories
  const allGenres = Array.from(
    new Set(initialStories.flatMap((story) => story.genre_tags))
  ).sort();

  // URL Sync
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (searchQuery) {
      params.set('q', searchQuery);
    } else {
      params.delete('q');
    }
    if (selectedGenre) {
      params.set('genre', selectedGenre);
    } else {
      params.delete('genre');
    }
    
    startTransition(() => {
      router.replace(`/search?${params.toString()}`, { scroll: false });
    });
  }, [searchQuery, selectedGenre, router]);

  // Filter logic
  const filteredStories = initialStories.filter((story) => {
    const matchesSearch =
      !searchQuery ||
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.universe_tag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.genre_tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGenre = !selectedGenre || story.genre_tags.includes(selectedGenre);

    return matchesSearch && matchesGenre;
  });

  const handleClear = () => {
    setSearchQuery('');
    setSelectedGenre(null);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 pb-24 md:pb-16">
      {/* Header Info */}
      <div className="text-center md:text-left">
        <h1 className="text-h2 font-bebas text-brand-primary tracking-wider uppercase">
          Find Stories
        </h1>
        <p className="text-body-default text-text-secondary mt-1">
          Explore our complete library of original AI comic series and dynamic manga layout releases
        </p>
      </div>

      {/* Premium Search Box */}
      <div className="p-6 rounded-2xl border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-6 shadow-xl shadow-black/5">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, genre, description, or universe..."
            className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-background border border-border-custom text-text-primary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all duration-200 text-body-default"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Genre Filters */}
        <div className="flex flex-col gap-2.5">
          <span className="text-caption font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-brand-primary" />
            Filter by Genre
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedGenre(null)}
              className={`px-3 py-1.5 rounded-lg text-caption font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer border ${
                selectedGenre === null
                  ? 'bg-brand-primary text-background border-brand-primary font-bold shadow-md shadow-brand-primary/10'
                  : 'bg-background hover:bg-surface-hover text-text-secondary border-border-custom'
              }`}
            >
              All Genres
            </button>
            {allGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre === selectedGenre ? null : genre)}
                className={`px-3 py-1.5 rounded-lg text-caption font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer border ${
                  genre === selectedGenre
                    ? 'bg-brand-primary text-background border-brand-primary font-bold shadow-md shadow-brand-primary/10'
                    : 'bg-background hover:bg-surface-hover text-text-secondary border-border-custom'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Output / Results */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-border-custom/50 pb-4">
          <span className="text-small font-semibold text-text-secondary">
            {isPending ? (
              <span className="animate-pulse">Searching...</span>
            ) : (
              `Found ${filteredStories.length} ${filteredStories.length === 1 ? 'story' : 'stories'}`
            )}
          </span>
          {(searchQuery || selectedGenre) && (
            <button
              onClick={handleClear}
              className="text-caption font-bold uppercase tracking-wider text-accent-blood-red hover:text-accent-hover-crimson transition-colors flex items-center gap-1 cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>

        {filteredStories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredStories.map((story) => (
              <div key={story.id} className="h-full animate-scale-up">
                <StoryCard story={story} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border-custom rounded-2xl bg-surface/30">
            <BookOpen className="w-12 h-12 text-text-muted mb-4 animate-pulse" />
            <h3 className="text-h4 text-brand-primary mb-1 uppercase tracking-wider">No Stories Match</h3>
            <p className="text-small text-text-secondary max-w-sm px-4">
              We couldn't find any series matching your query. Adjust your search words or choose another genre filter!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function SearchContainer({ initialStories }: SearchContainerProps) {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-32 w-full text-center">
        <Compass className="w-8 h-8 text-brand-primary animate-spin mb-3" />
        <span className="text-caption text-text-muted">Loading search terminal...</span>
      </div>
    }>
      <SearchContent initialStories={initialStories} />
    </Suspense>
  );
}
