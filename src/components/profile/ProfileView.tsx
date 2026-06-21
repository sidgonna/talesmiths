'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { User, BookOpen, Bookmark, Settings, Flame, Compass, Eye, LogOut, Check } from 'lucide-react';
import type { Profile, Story, Episode, EpisodeRead } from '@/types';

interface ExtendedRead extends EpisodeRead {
  stories?: Story;
  episodes?: Episode;
}

export function ProfileView() {
  const router = useRouter();
  const supabase = useSupabase();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [readingHistory, setReadingHistory] = useState<ExtendedRead[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'history' | 'bookmarks' | 'settings'>('history');
  
  // Settings edit state
  const [username, setUsername] = useState('');
  const [defaultMode, setDefaultMode] = useState<'vertical' | 'horizontal'>('vertical');
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const max_size = 96; // Tiny but recognizable avatar size
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress to JPEG with 0.5 quality (approx. 4-8KB size)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);

            const { error } = await supabase
              .from('profiles')
              .update({ avatar_url: compressedBase64 })
              .eq('id', profile.id);

            if (!error) {
              setProfile((prev) => prev ? { ...prev, avatar_url: compressedBase64 } : null);
            } else {
              alert('Failed to update avatar: ' + error.message);
            }
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error compressing avatar:', err);
      alert('Failed to upload avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };


  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        const userId = session.user.id;

        // 1. Fetch Profile
        const { data: profileData, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileData && !profileErr) {
          setProfile(profileData);
          setUsername(profileData.username || '');
          setDefaultMode(profileData.default_mode || 'vertical');
        }

        // 2. Fetch Reading History (episode_reads joined with stories and episodes)
        const { data: readsData, error: readsErr } = await supabase
          .from('episode_reads')
          .select('*, stories(*), episodes(*)')
          .eq('profile_id', userId)
          .order('last_read_at', { ascending: false });

        if (readsData && !readsErr) {
          setReadingHistory(readsData as ExtendedRead[]);
        }

        // 3. Fetch Bookmarks
        const { data: bookmarksData, error: bookmarksErr } = await supabase
          .from('story_bookmarks')
          .select('*, stories(*)')
          .eq('profile_id', userId);

        if (bookmarksData && !bookmarksErr) {
          setBookmarks(bookmarksData);
        }

      } catch (err) {
        console.error('Error fetching profile assets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [supabase, router]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingSettings(true);
    setSaveSuccess(false);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.trim(),
          default_mode: defaultMode,
        })
        .eq('id', profile.id);

      if (!error) {
        setProfile((prev) => prev ? { ...prev, username: username.trim(), default_mode: defaultMode } : null);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(error.message);
      }
    } catch (err) {
      console.error('Error saving profile preferences:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const computeReadingStats = () => {
    const totalChapters = readingHistory.length;
    const completedChapters = readingHistory.filter(r => r.completed).length;
    
    // Inferred favorite genre tag
    const genres = readingHistory.flatMap(r => r.stories?.genre_tags || []);
    const frequency: Record<string, number> = {};
    genres.forEach(g => { frequency[g] = (frequency[g] || 0) + 1; });
    const favoriteGenre = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    return { totalChapters, completedChapters, favoriteGenre };
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background py-20 text-text-secondary select-none">
        <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin mb-4" />
        <span className="text-caption font-semibold tracking-widest uppercase text-brand-primary">
          Loading Codex...
        </span>
      </div>
    );
  }

  if (!profile) return null;

  const stats = computeReadingStats();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Profile Overview Card */}
      <div className="p-6 rounded-2xl border border-border-custom bg-surface flex flex-col md:flex-row items-center justify-between gap-6 mb-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <div className="w-16 h-16 rounded-full border-2 border-brand-primary bg-background overflow-hidden flex items-center justify-center select-none relative group shrink-0 shadow-lg shadow-black/10">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-bebas text-h2 text-brand-primary uppercase">
                {profile.username.substring(0, 2)}
              </span>
            )}
            
            <label className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-brand-primary font-bold uppercase cursor-pointer transition-all duration-200 select-none">
              {uploadingAvatar ? '...' : 'Upload'}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploadingAvatar}
              />
            </label>
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <h2 className="text-h3 text-brand-primary uppercase tracking-wide">
                {profile.username}
              </h2>
              {profile.is_admin && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-accent-blood-red/10 border border-accent-blood-red/20 text-brand-primary select-none">
                  Creator
                </span>
              )}
            </div>
            <p className="text-caption text-text-muted mt-0.5">
              Member since {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-border-custom bg-background hover:bg-accent-blood-red/10 hover:border-accent-blood-red/20 text-text-secondary hover:text-accent-blood-red text-small font-semibold transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>

      {/* Grid: Left column Stats / Right column shelves */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side stats card */}
        <div className="flex flex-col gap-6">
          <div className="p-5 rounded-2xl border border-border-custom bg-surface flex flex-col gap-4">
            <h3 className="text-caption font-bold text-brand-primary uppercase tracking-widest border-b border-border-custom/50 pb-2">
              Reader Codex
            </h3>

            {/* Streak stat box */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="text-small font-bold text-text-primary">1 Day Streak</div>
                <div className="text-[11px] text-text-secondary">Keep the flame burning!</div>
              </div>
            </div>

            {/* Total Read box */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <div className="text-small font-bold text-text-primary">
                  {stats.totalChapters} Episodes
                </div>
                <div className="text-[11px] text-text-secondary">Opened or reading</div>
              </div>
            </div>

            {/* Fav Genre box */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <div className="text-small font-bold text-text-primary">
                  {stats.favoriteGenre}
                </div>
                <div className="text-[11px] text-text-secondary">Favorite Genre</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side tabs & lists */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Tab switches */}
          <div className="flex border-b border-border-custom gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-4 py-3 border-b-2 text-small font-bold uppercase tracking-wider transition-colors duration-200 focus:outline-none whitespace-nowrap ${
                activeTab === 'history'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Reading Shelf
            </button>
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`flex items-center gap-1.5 px-4 py-3 border-b-2 text-small font-bold uppercase tracking-wider transition-colors duration-200 focus:outline-none whitespace-nowrap ${
                activeTab === 'bookmarks'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              Bookmarks
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-4 py-3 border-b-2 text-small font-bold uppercase tracking-wider transition-colors duration-200 focus:outline-none whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>

          {/* TAB 1: Continue Reading list */}
          {activeTab === 'history' && (
            <div className="flex flex-col gap-4">
              {readingHistory.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {readingHistory.map((read) => {
                    const story = read.stories;
                    const ep = read.episodes;
                    if (!story || !ep) return null;

                    return (
                      <div
                        key={read.id}
                        className="p-4 rounded-xl border border-border-custom bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 hover:border-brand-primary/10"
                      >
                        <div className="flex-1">
                          <h4 className="text-small font-bold text-brand-primary">
                            {story.title}
                          </h4>
                          <p className="text-body-default text-text-primary font-semibold mt-0.5">
                            {ep.title ? `Ep ${ep.episode_number}: ${ep.title}` : `Episode ${ep.episode_number}`}
                          </p>
                          {/* Progress bar info */}
                          <div className="flex items-center gap-2 mt-2 max-w-xs">
                            <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden border border-border-custom/50">
                              <div
                                className="h-full bg-brand-primary"
                                style={{ width: `${read.progress * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-text-secondary font-bold shrink-0">
                              {Math.round(read.progress * 100)}%
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => router.push(`/stories/${story.slug}/${ep.slug}`)}
                          className="px-4 py-2 text-caption font-bold bg-accent-blood-red hover:bg-accent-hover-crimson text-text-primary rounded-lg transition-colors"
                        >
                          Resume
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border-custom rounded-2xl bg-surface/30">
                  <BookOpen className="w-10 h-10 text-text-muted mb-3" />
                  <h4 className="text-body-default font-bold text-text-secondary">Your shelf is empty</h4>
                  <p className="text-small text-text-muted max-w-xs mt-1">
                    Start reading episodes to track progress here.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Bookmarks list */}
          {activeTab === 'bookmarks' && (
            <div className="flex flex-col gap-4">
              {bookmarks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {bookmarks.map((bookmark) => {
                    const story = bookmark.stories;
                    if (!story) return null;

                    return (
                      <div
                        key={bookmark.id}
                        onClick={() => router.push(`/stories/${story.slug}`)}
                        className="p-4 rounded-xl border border-border-custom bg-surface hover:border-brand-primary/20 hover:bg-surface-hover cursor-pointer transition-all duration-200 flex items-center justify-between"
                      >
                        <div>
                          <h4 className="text-body-default font-bold text-brand-primary uppercase">
                            {story.title}
                          </h4>
                          <span className="inline-block text-[10px] px-2 py-0.5 rounded border border-border-custom text-text-muted mt-1 uppercase">
                            {story.status}
                          </span>
                        </div>
                        <Bookmark className="w-5 h-5 text-brand-primary fill-current" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border-custom rounded-2xl bg-surface/30">
                  <Bookmark className="w-10 h-10 text-text-muted mb-3" />
                  <h4 className="text-body-default font-bold text-text-secondary">No Bookmarked Stories</h4>
                  <p className="text-small text-text-muted max-w-xs mt-1">
                    Bookmark your favorite stories to save them here.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Settings panel */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl border border-border-custom bg-surface flex flex-col gap-6">
              <h3 className="text-caption font-bold text-brand-primary uppercase tracking-widest border-b border-border-custom/50 pb-2 mb-2">
                User Preferences
              </h3>

              {/* Username Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-caption font-bold text-text-secondary uppercase tracking-wide">
                  Display Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full max-w-md px-4 py-2.5 rounded-lg border border-border-custom bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary transition-colors text-small"
                />
              </div>



              {/* Default format preferences */}
              <div className="flex flex-col gap-1.5">
                <label className="text-caption font-bold text-text-secondary uppercase tracking-wide">
                  Default Reading Mode
                </label>
                <select
                  value={defaultMode}
                  onChange={(e) => setDefaultMode(e.target.value as any)}
                  className="w-full max-w-md px-4 py-2.5 rounded-lg border border-border-custom bg-background text-text-primary focus:outline-none focus:border-brand-primary transition-colors text-small"
                >
                  <option value="vertical">Vertical Scroll (Webtoon style)</option>
                  <option value="horizontal">Horizontal Page (Manga style)</option>
                </select>
              </div>

              {/* Submit CTA */}
              <div className="flex items-center gap-4 mt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 rounded-lg bg-accent-blood-red hover:bg-accent-hover-crimson disabled:bg-surface-hover text-text-primary text-small font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </button>
                {saveSuccess && (
                  <span className="inline-flex items-center gap-1 text-[12px] text-status-success font-semibold">
                    <Check className="w-4 h-4" />
                    Preferences updated!
                  </span>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
