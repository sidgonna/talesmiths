'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Story } from '@/types';
import { ShareModal } from '@/components/share/ShareModal';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { Play, Bookmark, BookmarkCheck, Share2 } from 'lucide-react';

interface StoryActionsProps {
  story: Story;
  firstEpisodeSlug?: string;
}

export function StoryActions({ story, firstEpisodeSlug }: StoryActionsProps) {
  const supabase = useSupabase();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loadingBookmark, setLoadingBookmark] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Load bookmark status on mount if authenticated
  useEffect(() => {
    const checkBookmark = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoadingBookmark(false);
          return;
        }

        const { data, error } = await supabase
          .from('story_bookmarks')
          .select('id')
          .eq('profile_id', session.user.id)
          .eq('story_id', story.id)
          .maybeSingle();

        if (data && !error) {
          setIsBookmarked(true);
        }
      } catch (err) {
        console.error('Error checking bookmark status:', err);
      } finally {
        setLoadingBookmark(false);
      }
    };

    checkBookmark();
  }, [supabase, story.id]);

  const handleToggleBookmark = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Direct to login page if guest tries to bookmark
        const currentPath = window.location.pathname;
        window.location.href = `/login?next=${encodeURIComponent(currentPath)}`;
        return;
      }

      if (isBookmarked) {
        // Delete Bookmark
        const { error } = await supabase
          .from('story_bookmarks')
          .delete()
          .eq('profile_id', session.user.id)
          .eq('story_id', story.id);
          
        if (!error) setIsBookmarked(false);
      } else {
        // Add Bookmark
        const { error } = await supabase
          .from('story_bookmarks')
          .insert({
            profile_id: session.user.id,
            story_id: story.id,
          });
          
        if (!error) setIsBookmarked(true);
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-4 mt-4 w-full sm:w-auto">
        {/* Play Button */}
        {firstEpisodeSlug ? (
          <Link
            href={`/stories/${story.slug}/${firstEpisodeSlug}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-accent-blood-red hover:bg-accent-hover-crimson text-text-primary text-small font-semibold transition-all duration-200 shadow-lg shadow-accent-blood-red/10 focus:outline-none focus:ring-2 focus:ring-accent-blood-red/50"
          >
            <Play className="w-4 h-4 fill-current" />
            Start Reading
          </Link>
        ) : (
          <button
            disabled
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-surface border border-border-custom text-text-muted text-small font-semibold cursor-not-allowed"
          >
            Coming Soon
          </button>
        )}

        {/* Bookmark Button */}
        <button
          onClick={handleToggleBookmark}
          disabled={loadingBookmark}
          className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-border-custom bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary text-small font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 cursor-pointer disabled:opacity-50`}
        >
          {isBookmarked ? (
            <>
              <BookmarkCheck className="w-4 h-4 text-brand-primary fill-current" />
              Bookmarked
            </>
          ) : (
            <>
              <Bookmark className="w-4 h-4" />
              Bookmark
            </>
          )}
        </button>

        {/* Share Button */}
        <button
          onClick={() => setIsShareOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-border-custom bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary text-small font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 cursor-pointer"
        >
          <Share2 className="w-4 h-4 text-brand-primary" />
          Share
        </button>
      </div>

      {/* Share Modal container */}
      <ShareModal
        story={story}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </>
  );
}
