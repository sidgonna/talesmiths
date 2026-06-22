'use client';

import { useState, useEffect } from 'react';
import { Story, Episode, Panel } from '@/types';
import { VerticalReader } from '@/components/reader/VerticalReader';
import { HorizontalReader } from '@/components/reader/HorizontalReader';
import { ReaderControls } from '@/components/reader/ReaderControls';
import { SoftLoginPrompt } from '@/components/reader/SoftLoginPrompt';
import { useSupabase } from '@/components/providers/SupabaseProvider';

interface ReaderViewProps {
  story: Story;
  currentEpisode: Episode;
  allEpisodes: Episode[];
  panels: Panel[];
}

export function ReaderView({ story, currentEpisode, allEpisodes, panels }: ReaderViewProps) {
  const supabase = useSupabase();
  const [progress, setProgress] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [initialProgress, setInitialProgress] = useState(0);
  const [initialPage, setInitialPage] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(true);

  // Resolve reading mode: Episode level override -> Story default -> Vertical fallback
  const resolvedMode = currentEpisode.read_mode || story.read_mode || 'vertical';
  const resolvedDirection = currentEpisode.direction || story.direction || 'ltr';

  // Load initial progress from Supabase (if logged in) or localStorage (anonymous)
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Logged-in user: fetch progress from database
          const { data, error } = await supabase
            .from('episode_reads')
            .select('progress, current_page')
            .eq('profile_id', session.user.id)
            .eq('episode_id', currentEpisode.id)
            .maybeSingle();
            
          if (data && !error) {
            setProgress(data.progress);
            setInitialProgress(data.progress);
            setInitialPage(data.current_page);
          }
        } else {
          // Anonymous user: fetch progress from localStorage
          const localData = localStorage.getItem('talesmiths-reading-progress');
          if (localData) {
            const parsed = JSON.parse(localData);
            const saved = parsed[currentEpisode.id];
            if (saved) {
              setProgress(saved.progress || 0);
              setInitialProgress(saved.progress || 0);
              setInitialPage(saved.current_page || 0);
            }
          }
        }
      } catch (err) {
        console.error('Error loading reading progress:', err);
      } finally {
        setLoadingProgress(false);
      }
    };

    loadProgress();
  }, [currentEpisode.id, supabase]);

  // Increment view count on load
  useEffect(() => {
    const incrementView = async () => {
      try {
        await supabase.rpc('increment_episode_view', { ep_id: currentEpisode.id });
      } catch (err) {
        console.error('Error incrementing view count:', err);
      }
    };
    incrementView();
  }, [currentEpisode.id, supabase]);


  // Save progress dynamically as they read
  const handleProgressChange = async (indexOrProgress: number, calculatedProgress?: number) => {
    let nextProgress = indexOrProgress;
    let nextPage = 0;

    if (resolvedMode === 'horizontal') {
      nextPage = indexOrProgress;
      nextProgress = calculatedProgress || 0;
    }

    setProgress(nextProgress);

    // Save to local cache or cloud
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Upsert to Supabase
        await supabase
          .from('episode_reads')
          .upsert({
            profile_id: session.user.id,
            episode_id: currentEpisode.id,
            story_id: story.id,
            progress: nextProgress,
            current_page: nextPage,
            last_read_at: new Date().toISOString(),
          }, {
            onConflict: 'profile_id,episode_id'
          });
      } else {
        // Save to localStorage
        const localData = localStorage.getItem('talesmiths-reading-progress') || '{}';
        const parsed = JSON.parse(localData);
        parsed[currentEpisode.id] = {
          progress: nextProgress,
          current_page: nextPage,
          story_id: story.id,
          lastRead: new Date().toISOString()
        };
        localStorage.setItem('talesmiths-reading-progress', JSON.stringify(parsed));
      }
    } catch (err) {
      console.error('Error saving reading progress:', err);
    }
  };

  // Toggle overlay controls when user taps middle of the screen
  const toggleControls = () => {
    setControlsVisible((prev) => !prev);
  };

  // Auto-hide controls after 3 seconds of load, but keep visible initially
  useEffect(() => {
    const timer = setTimeout(() => {
      setControlsVisible(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, [currentEpisode.id]);

  if (loadingProgress) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background py-20 text-text-secondary select-none">
        <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin mb-4" />
        <span className="text-caption font-semibold tracking-widest uppercase text-brand-primary">
          Opening Manuscript...
        </span>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col w-full h-screen h-[100dvh] overflow-hidden bg-black">
      {/* Floating navigation overlay header/footer */}
      <ReaderControls
        story={story}
        currentEpisode={currentEpisode}
        allEpisodes={allEpisodes}
        progress={progress}
        visible={controlsVisible}
        onToggleVisibility={toggleControls}
      />

      {/* Main reader viewports */}
      <div onClick={(e) => {
        // Only toggle if the user is clicking in the center 20% strip of the screen
        const width = window.innerWidth;
        const x = e.clientX;
        if (x > width * 0.4 && x < width * 0.6) {
          toggleControls();
        }
      }} className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {resolvedMode === 'vertical' ? (
          <VerticalReader
            panels={panels}
            onProgressChange={handleProgressChange}
            initialProgress={initialProgress}
            episodeId={currentEpisode.id}
          />
        ) : (
          <HorizontalReader
            panels={panels}
            direction={resolvedDirection}
            onProgressChange={(page, prog) => handleProgressChange(page, prog)}
            initialPage={initialPage}
          />
        )}
      </div>

      {/* Non-intrusive dismissible signup prompt */}
      <SoftLoginPrompt
        episodeNumber={currentEpisode.episode_number}
        progress={progress}
      />
    </div>
  );
}
