'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, Upload, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface Story {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  genre_tags: string[];
  status: 'ongoing' | 'completed' | 'hiatus';
  read_mode: 'vertical' | 'horizontal';
  direction: 'ltr' | 'rtl';
  universe_tag: string | null;
  is_featured: boolean;
  display_order: number;
  created_at: string;
}

export function StoryForm() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [genreTagsText, setGenreTagsText] = useState('');
  const [status, setStatus] = useState<'ongoing' | 'completed' | 'hiatus'>('ongoing');
  const [readMode, setReadMode] = useState<'vertical' | 'horizontal'>('vertical');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [universeTag, setUniverseTag] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(0);

  // Status indicators
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stories');
      if (res.ok) {
        const data = await res.json();
        setStories(data.stories || []);
      }
    } catch (err) {
      console.error('Failed to load stories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (!editingStory && title) {
      const generated = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      setSlug(generated);
    }
  }, [title, editingStory]);

  const handleOpenNew = () => {
    setEditingStory(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setCoverUrl('');
    setGenreTagsText('');
    setStatus('ongoing');
    setReadMode('vertical');
    setDirection('ltr');
    setUniverseTag('');
    setIsFeatured(false);
    setDisplayOrder(stories.length);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (story: Story) => {
    setEditingStory(story);
    setTitle(story.title);
    setSlug(story.slug);
    setDescription(story.description || '');
    setCoverUrl(story.cover_url || '');
    setGenreTagsText(story.genre_tags.join(', '));
    setStatus(story.status);
    setReadMode(story.read_mode);
    setDirection(story.direction);
    setUniverseTag(story.universe_tag || '');
    setIsFeatured(story.is_featured);
    setDisplayOrder(story.display_order);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsFormOpen(true);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    setErrorMsg(null);

    try {
      // 1. Request presigned upload URL
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'cover',
          storySlug: slug || 'temp',
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to request presigned upload URL');
      }

      const { uploadUrl, cdnUrl } = await response.json();

      // 2. Upload file directly to R2 bucket via presigned URL
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file to R2');
      }

      setCoverUrl(cdnUrl);
      setSuccessMsg('Cover image uploaded successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Cover upload error:', err);
      setErrorMsg(err.message || 'Failed to upload cover image.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const genre_tags = genreTagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const payload = {
      id: editingStory?.id,
      slug,
      title,
      description: description || null,
      cover_url: coverUrl || null,
      genre_tags,
      status,
      read_mode: readMode,
      direction,
      universe_tag: universeTag || null,
      is_featured: isFeatured,
      display_order: displayOrder,
    };

    try {
      const response = await fetch('/api/admin/stories', {
        method: editingStory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save story.');
      }

      setSuccessMsg(editingStory ? 'Story updated successfully!' : 'Story created successfully!');
      fetchStories();
      setTimeout(() => {
        setIsFormOpen(false);
        setSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save story.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to delete the story "${name}"? This will permanently delete all its episodes and panels. This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/stories?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchStories();
        alert('Story deleted successfully.');
      } else {
        const result = await response.json();
        alert(result.error || 'Failed to delete story.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Network error occurred.');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-h2 font-bebas text-brand-primary tracking-wider uppercase">
            Story Management
          </h2>
          <p className="text-body-default text-text-secondary mt-1">
            Create, update, and manage your manga series collections
          </p>
        </div>
        {!isFormOpen && (
          <button
            onClick={handleOpenNew}
            className="px-4 py-2.5 rounded-lg bg-accent-blood-red hover:bg-accent-hover-crimson text-small font-bold uppercase tracking-wider text-text-primary transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Story
          </button>
        )}
      </div>

      {/* Main Grid: Form Overlay or Story List */}
      {isFormOpen ? (
        <div className="p-6 rounded-xl border border-border-custom bg-surface animate-scale-up">
          <div className="flex justify-between items-center border-b border-border-custom pb-4 mb-6">
            <h3 className="text-h3 font-bebas text-brand-primary uppercase tracking-wider">
              {editingStory ? 'Edit Story Details' : 'Publish New Series'}
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-small text-text-secondary hover:text-text-primary cursor-pointer px-3 py-1.5 rounded bg-background border border-border-custom transition-all"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Side fields */}
            <div className="md:col-span-2 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-small font-semibold text-text-secondary">Story Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="px-4 py-2.5 rounded-lg bg-background border border-border-custom text-text-primary focus:outline-none focus:border-brand-primary transition-all"
                  placeholder="e.g. Mahakala"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-small font-semibold text-text-secondary">URL Slug</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="px-4 py-2.5 rounded-lg bg-background border border-border-custom text-text-primary focus:outline-none focus:border-brand-primary transition-all font-mono"
                    placeholder="e.g. mahakala"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-small font-semibold text-text-secondary">Universe Tag</label>
                  <input
                    type="text"
                    value={universeTag}
                    onChange={(e) => setUniverseTag(e.target.value)}
                    className="px-4 py-2.5 rounded-lg bg-background border border-border-custom text-text-primary focus:outline-none focus:border-brand-primary transition-all"
                    placeholder="e.g. mahakala-universe"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-small font-semibold text-text-secondary">Synopsis Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="px-4 py-2.5 rounded-lg bg-background border border-border-custom text-text-primary focus:outline-none focus:border-brand-primary transition-all resize-none"
                  placeholder="Summarize the storyline and characters..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-small font-semibold text-text-secondary">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="px-4 py-2.5 rounded-lg bg-background border border-border-custom text-text-primary focus:outline-none focus:border-brand-primary transition-all"
                  >
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="hiatus">Hiatus</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-small font-semibold text-text-secondary">Default Reading Mode</label>
                  <select
                    value={readMode}
                    onChange={(e) => setReadMode(e.target.value as any)}
                    className="px-4 py-2.5 rounded-lg bg-background border border-border-custom text-text-primary focus:outline-none focus:border-brand-primary transition-all"
                  >
                    <option value="vertical">Vertical Scroll</option>
                    <option value="horizontal">Horizontal Page-Flip</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-small font-semibold text-text-secondary">Page Orientation (Horizontal)</label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as any)}
                    className="px-4 py-2.5 rounded-lg bg-background border border-border-custom text-text-primary focus:outline-none focus:border-brand-primary transition-all"
                  >
                    <option value="ltr">Left to Right (LTR)</option>
                    <option value="rtl">Right to Left (RTL)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-small font-semibold text-text-secondary">Genre Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={genreTagsText}
                    onChange={(e) => setGenreTagsText(e.target.value)}
                    className="px-4 py-2.5 rounded-lg bg-background border border-border-custom text-text-primary focus:outline-none focus:border-brand-primary transition-all"
                    placeholder="Action, Shonen, Dark Fantasy"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-small font-semibold text-text-secondary">Display Order Index</label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="px-4 py-2.5 rounded-lg bg-background border border-border-custom text-text-primary focus:outline-none focus:border-brand-primary transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="is-featured"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-border-custom text-brand-primary focus:ring-brand-primary/50 cursor-pointer"
                />
                <label htmlFor="is-featured" className="text-small font-semibold text-text-primary cursor-pointer select-none">
                  Pin to Home Screen (Featured)
                </label>
              </div>
            </div>

            {/* Right Side: Cover art upload and notifications */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-small font-semibold text-text-secondary">Cover Image Art</span>
                
                {coverUrl ? (
                  <div className="relative aspect-[3/4] rounded-lg border border-border-custom bg-background overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCoverUrl('')}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-status-error font-semibold text-caption transition-all cursor-pointer"
                    >
                      Remove Artwork
                    </button>
                  </div>
                ) : (
                  <div className="aspect-[3/4] rounded-lg border-2 border-dashed border-border-custom bg-background hover:bg-surface-hover/30 transition-colors flex flex-col items-center justify-center gap-3 p-4 text-center cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      disabled={uploadingCover}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {uploadingCover ? (
                      <>
                        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                        <span className="text-caption text-text-secondary">Uploading to R2...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-text-muted" />
                        <div>
                          <span className="text-caption font-semibold text-text-primary block">Upload cover art</span>
                          <span className="text-[10px] text-text-muted block mt-1">WebP, JPEG, PNG (Recom. ratio: 3:4)</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Status Alerts */}
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

              <button
                type="submit"
                disabled={formSubmitting || uploadingCover}
                className="w-full py-3 rounded-lg bg-accent-blood-red hover:bg-accent-hover-crimson text-small font-bold uppercase tracking-wider text-text-primary transition-colors cursor-pointer disabled:opacity-50 mt-4 shadow-lg shadow-accent-blood-red/10 flex items-center justify-center gap-2"
              >
                {formSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Series...
                  </>
                ) : (
                  editingStory ? 'Save Changes' : 'Create & Publish'
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="rounded-xl border border-border-custom bg-surface overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-text-muted text-caption flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
              <span>Fetching story directories...</span>
            </div>
          ) : stories.length === 0 ? (
            <div className="py-16 text-center text-text-muted text-caption">
              No manga series created yet. Click "Add New Story" to create your first comic collection.
            </div>
          ) : (
            <div className="divide-y divide-border-custom">
              {stories.map((story) => (
                <div key={story.id} className="flex items-center justify-between p-4 bg-surface hover:bg-surface-hover/20 transition-all gap-4">
                  <div className="flex items-center gap-4">
                    {/* Cover Art */}
                    <div className="w-12 h-16 rounded border border-border-custom overflow-hidden bg-background shrink-0">
                      {story.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={story.cover_url} alt={story.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-text-muted font-bold">NO ART</div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div>
                      <h4 className="text-body-default font-bold text-text-primary flex items-center gap-2">
                        {story.title}
                        {story.is_featured && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-brand-primary/10 border border-brand-primary/20 text-brand-primary uppercase font-bold tracking-wide">
                            Featured
                          </span>
                        )}
                      </h4>
                      <p className="text-caption text-text-muted mt-0.5 font-mono">
                        slug: /{story.slug} | mode: {story.read_mode} ({story.direction.toUpperCase()})
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                          story.status === 'ongoing' ? 'bg-status-success/10 border border-status-success/20 text-status-success' :
                          story.status === 'completed' ? 'bg-status-info/10 border border-status-info/20 text-status-info' :
                          'bg-status-warning/10 border border-status-warning/20 text-status-warning'
                        }`}>
                          {story.status}
                        </span>
                        <span className="text-[10px] text-text-muted">Order: {story.display_order}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(story)}
                      className="p-2 rounded bg-background hover:bg-surface border border-border-custom text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                      title="Edit Story"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(story.id, story.title)}
                      className="p-2 rounded bg-background hover:bg-status-error/10 border border-border-custom hover:border-status-error/30 text-text-secondary hover:text-status-error transition-all cursor-pointer"
                      title="Delete Story"
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
