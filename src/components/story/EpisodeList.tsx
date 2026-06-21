'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Episode, Story } from '@/types';
import { ArrowUpDown, Play, Eye, Heart, Calendar, BookOpen } from 'lucide-react';

interface EpisodeListProps {
  story: Story;
  episodes: Episode[];
}

export function EpisodeList({ story, episodes }: EpisodeListProps) {
  const [ascending, setAscending] = useState(true);

  // Sort episodes by episode_number
  const sortedEpisodes = [...episodes].sort((a, b) => {
    return ascending
      ? a.episode_number - b.episode_number
      : b.episode_number - a.episode_number;
  });

  const getFormatDate = (dateString: string | null) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex flex-col gap-6 mt-8">
      {/* Header controls */}
      <div className="flex items-center justify-between border-b border-border-custom pb-4">
        <h3 className="text-h3 text-brand-primary uppercase tracking-wider">
          Episodes ({episodes.length})
        </h3>
        
        {episodes.length > 1 && (
          <button
            onClick={() => setAscending(!ascending)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-custom bg-surface hover:bg-surface-hover text-small text-text-secondary hover:text-text-primary transition-all duration-200"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort: {ascending ? 'Oldest First' : 'Newest First'}
          </button>
        )}
      </div>

      {/* Episodes list */}
      {sortedEpisodes.length > 0 ? (
        <div className="flex flex-col gap-3">
          {sortedEpisodes.map((episode) => {
            const hasTitle = !!episode.title;
            const displayLabel = hasTitle 
              ? `Episode ${episode.episode_number}: ${episode.title}`
              : `Episode ${episode.episode_number}`;

            return (
              <Link
                key={episode.id}
                href={`/stories/${story.slug}/${episode.slug}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border-custom bg-surface hover:border-brand-primary/20 hover:bg-surface-hover transition-all duration-200 gap-4"
              >
                <div className="flex items-center gap-4">
                  {/* Play Button Icon */}
                  <div className="w-10 h-10 rounded-lg bg-background border border-border-custom flex items-center justify-center text-text-secondary group-hover:text-brand-primary group-hover:border-brand-primary/30 transition-all duration-200">
                    <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform duration-200" />
                  </div>
                  <div>
                    <h4 className="text-body-default font-semibold text-text-primary group-hover:text-brand-primary transition-colors duration-200">
                      {displayLabel}
                    </h4>
                    <div className="flex items-center gap-4 mt-1 text-caption text-text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {getFormatDate(episode.published_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Engagement metrics */}
                <div className="flex items-center gap-6 text-caption text-text-secondary pr-2">
                  <span className="inline-flex items-center gap-1" title="Views">
                    <Eye className="w-4 h-4 text-text-muted" />
                    {episode.view_count.toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-1" title="Likes">
                    <Heart className="w-4 h-4 text-text-muted group-hover:text-accent-blood-red/80 transition-colors duration-200" />
                    {episode.like_count.toLocaleString()}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border-custom rounded-xl bg-surface/30">
          <BookOpen className="w-10 h-10 text-text-muted mb-3" />
          <h4 className="text-body-default font-bold text-text-secondary">No Episodes Published</h4>
          <p className="text-small text-text-muted max-w-xs mt-1">
            The creators haven't published any episodes for this story yet. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
