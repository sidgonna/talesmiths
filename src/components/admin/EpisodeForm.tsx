'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { PanelUploader } from './PanelUploader';

interface Story {
  id: string;
  slug: string;
  title: string;
}

interface Panel {
  id?: string;
  r2_key: string;
  cdn_url: string;
  display_order: number;
  width: number;
  height: number;
}

interface Episode {
  id: string;
  story_id: string;
  episode_number: number;
  title: string | null;
  slug: string;
  read_mode: 'vertical' | 'horizontal' | null;
  direction: 'ltr' | 'rtl' | null;
  status: 'draft' | 'published' | 'scheduled';
  created_at: string;
  panels?: Panel[];
}

export function EpisodeForm() {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState('');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);

  // Form Fields
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [readMode, setReadMode] = useState<string>('none');
  const [direction, setDirection] = useState<string>('none');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [panels, setPanels] = useState<Panel[]>([]);

  // Status indicators
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch stories on load
  useEffect(() => {
    async function loadStories() {
      try {
        const res = await fetch('/api/admin/stories');
        if (res.ok) {
          const data = await res.json();
          setStories(data.stories || []);
          if (data.stories?.length > 0) {
            setSelectedStoryId(data.stories[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load stories:', err);
      } finally {
        setLoadingStories(false);
      }
    }
    loadStories();
  }, []);

  // Fetch episodes when selected story changes
  const fetchEpisodes = async (storyId: string) => {
    if (!storyId) return;
    setLoadingEpisodes(true);
    try {
      const res = await fetch(`/api/admin/episodes?story_id=${storyId}`);
      if (res.ok) {
        const data = await res.json();
        setEpisodes(data.episodes || []);
      }
    } catch (err) {
      console.error('Failed to load episodes:', err);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  useEffect(() => {
    if (selectedStoryId) {
      fetchEpisodes(selectedStoryId);
    }
  }, [selectedStoryId]);

  // Find selected story slug to pass to uploader
  const selectedStory = stories.find(s => s.id === selectedStoryId);

  // Auto-generate slug from episode number and title
  useEffect(() => {
    if (!editingEpisode && episodeNumber) {
      let generated = `episode-${episodeNumber}`;
      if (title) {
        const cleanTitle = title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-');
        generated += `-${cleanTitle}`;
      }
      setSlug(generated);
    }
  }, [episodeNumber, title, editingEpisode]);

  const handleOpenNew = () => {
    // Determine next episode number automatically
    const nextNum = episodes.length > 0 
      ? Math.max(...episodes.map(e => e.episode_number)) + 1 
      : 1;

    setEditingEpisode(null);
    setEpisodeNumber(nextNum);
    setTitle('');
    setSlug(`episode-${nextNum}`);
    setReadMode('none');
    setDirection('none');
    setStatus('draft');
    setPanels([]);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (ep: Episode) => {
    setEditingEpisode(ep);
    setEpisodeNumber(ep.episode_number);
    setTitle(ep.title || '');
    setSlug(ep.slug);
    setReadMode(ep.read_mode || 'none');
    setDirection(ep.direction || 'none');
    setStatus(ep.status === 'published' ? 'published' : 'draft');
    setPanels(ep.panels || []);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      id: editingEpisode?.id,
      story_id: selectedStoryId,
      episode_number: Number(episodeNumber),
      title: title || null,
      slug,
      read_mode: readMode === 'none' ? null : readMode,
      direction: direction === 'none' ? null : direction,
      status,
      panels: panels.map((p, idx) => ({ ...p, display_order: idx })),
    };

    try {
      const response = await fetch('/api/admin/episodes', {
        method: editingEpisode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save episode.');
      }

      setSuccessMsg(editingEpisode ? 'Episode updated successfully!' : 'Episode published successfully!');
      fetchEpisodes(selectedStoryId);
      setTimeout(() => {
        setIsFormOpen(false);
        setSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save episode.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string, num: number) => {
    if (!confirm(`Are you absolutely sure you want to delete Episode ${num}? This will permanently delete all its manga panels. This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/episodes?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchEpisodes(selectedStoryId);
        alert('Episode deleted successfully.');
      } else {
        const result = await response.json();
        alert(result.error || 'Failed to delete episode.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Network error occurred.');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Selection controls & header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-custom/50 pb-5">
        <div>
          <h2 className="text-h2 font-bebas text-brand-primary tracking-wider uppercase">
            Episode Management
          </h2>
          <p className="text-body-default text-text-secondary mt-1">
            Publish chapters and upload vertical/horizontal manga panels
          </p>
        </div>

        {!isFormOpen && (
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="story-select" className="text-[10px] uppercase font-bold text-text-muted">Select Story</label>
              <select
                id="story-select"
                value={selectedStoryId}
                onChange={(e) => setSelectedStoryId(e.target.value)}
                className="px-3 py-2 rounded-lg bg-surface border border-border-custom text-text-primary text-small focus:outline-none focus:border-brand-primary transition-all min-w-[200px]"
                disabled={loadingStories}
              >
                {stories.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>

            {selectedStoryId && (
              <button
                onClick={handleOpenNew}
                className="px-4 py-2.5 rounded-lg bg-accent-blood-red hover:bg-accent-hover-crimson text-small font-bold uppercase tracking-wider text-text-primary transition-all flex items-center gap-2 cursor-pointer mt-5"
              >
                <Plus className="w-4 h-4" />
                Add Episode
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Form or List content */}
      {isFormOpen ? (
        <div className="p-6 rounded-xl border border-border-custom bg-surface animate-scale-up">
          <div className="flex justify-between items-center border-b border-border-custom pb-4 mb-6">
            <h3 className="text-h3 font-bebas text-brand-primary uppercase tracking-wider">
              {editingEpisode ? `Edit Episode ${episodeNumber}` : `Create Episode in "${selectedStory?.title}"`}
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-small text-text-secondary hover:text-text-primary cursor-pointer px-3 py-1.5 rounded bg-background border border-border-custom transition-all"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-small font-semibold text-text-secondary">Episode Number</label>
                <input
                  type="number"
                  value={episodeNumber}
                  onChange={(e) => setEpisodeNumber(Number(e.target.value))}
                  className="px-4 py-2.5 rounded-lg bg-background border border-border-custom text-text-primary focus:outline-none focus:border-brand-primary transition-all"
                  min={1}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-small font-semibold text-text-secondary">Episode Title (Optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="px-4 py-2.5 rounded-lg bg-background border border-border-custom text-text-primary focus:outline-none focus:border-brand-primary transition-all"
                  placeholder="e.g. The Awakening"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-small font-semibold text-text-secondary">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="px-4 py-2.5 rounded-lg bg-background border border-border-custom text-text-primary focus:outline-none focus:border-brand-primary transition-all"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-small font-semibold text-text-secondary">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="px-4 py-2.5 rounded-lg bg-background border border-border-custom text-text-primary focus:outline-none focus:border-brand-primary transition-all font-mono"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-small font-semibold text-text-secondary">Reading Mode Override</label>
                <select
                  value={readMode}
                  onChange={(e) => setReadMode(e.target.value)}
                  className="px-4 py-2.5 rounded-lg bg-background border border-border-custom text-text-primary focus:outline-none focus:border-brand-primary transition-all"
                >
                  <option value="none">Use Story Default</option>
                  <option value="vertical">Vertical Scroll</option>
                  <option value="horizontal">Horizontal Page-Flip</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-small font-semibold text-text-secondary">Page Direction Override</label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  className="px-4 py-2.5 rounded-lg bg-background border border-border-custom text-text-primary focus:outline-none focus:border-brand-primary transition-all"
                >
                  <option value="none">Use Story Default</option>
                  <option value="ltr">Left to Right (LTR)</option>
                  <option value="rtl">Right to Left (RTL)</option>
                </select>
              </div>
            </div>

            {/* Embedded Panel Uploader */}
            {selectedStory && (
              <PanelUploader
                storySlug={selectedStory.slug}
                episodeNumber={episodeNumber}
                panels={panels}
                onChange={setPanels}
              />
            )}

            {/* Alerts & Submit */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded bg-status-error/10 border border-status-error/25 text-status-error text-caption">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 p-3 rounded bg-status-success/10 border border-status-success/25 text-status-success text-caption animate-pulse">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4 border-t border-border-custom/50 pt-4">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-5 py-2.5 rounded-lg border border-border-custom bg-background hover:bg-surface-hover transition-colors text-small font-bold text-text-secondary uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSubmitting || panels.length === 0}
                className="px-6 py-2.5 rounded-lg bg-accent-blood-red hover:bg-accent-hover-crimson text-small font-bold text-text-primary uppercase tracking-wider transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-2"
              >
                {formSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingEpisode ? 'Save Changes' : 'Publish Episode'
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="rounded-xl border border-border-custom bg-surface overflow-hidden">
          {loadingEpisodes ? (
            <div className="py-16 text-center text-text-muted text-caption flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
              <span>Fetching episodes index...</span>
            </div>
          ) : episodes.length === 0 ? (
            <div className="py-16 text-center text-text-muted text-caption">
              No chapters published for this story yet. Click "Add Episode" to create your first chapter.
            </div>
          ) : (
            <div className="divide-y divide-border-custom">
              {episodes.map((ep) => (
                <div key={ep.id} className="flex items-center justify-between p-4 bg-surface hover:bg-surface-hover/20 transition-all gap-4">
                  <div className="flex items-center gap-4">
                    {/* Chapter Number Badge */}
                    <div className="w-10 h-10 rounded-lg bg-background border border-border-custom text-brand-primary flex items-center justify-center font-bebas text-h3 tracking-wide shrink-0">
                      {ep.episode_number}
                    </div>

                    {/* Metadata */}
                    <div>
                      <h4 className="text-body-default font-bold text-text-primary flex items-center gap-2">
                        {ep.title ? `Episode ${ep.episode_number}: ${ep.title}` : `Episode ${ep.episode_number}`}
                        <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold ${
                          ep.status === 'published' ? 'bg-status-success/15 border border-status-success/30 text-status-success' : 'bg-status-warning/15 border border-status-warning/30 text-status-warning'
                        }`}>
                          {ep.status}
                        </span>
                      </h4>
                      <p className="text-caption text-text-muted mt-0.5 font-mono">
                        slug: /{ep.slug} | panels: {ep.panels?.length || 0} pages
                        {ep.read_mode && ` | mode override: ${ep.read_mode}`}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(ep)}
                      className="p-2 rounded bg-background hover:bg-surface border border-border-custom text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                      title="Edit Episode"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ep.id, ep.episode_number)}
                      className="p-2 rounded bg-background hover:bg-status-error/10 border border-border-custom hover:border-status-error/30 text-text-secondary hover:text-status-error transition-all cursor-pointer"
                      title="Delete Episode"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
