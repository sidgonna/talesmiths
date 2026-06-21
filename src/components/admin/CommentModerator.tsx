'use client';

import { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Check, Trash2, RotateCcw, MessageSquare, Loader2 } from 'lucide-react';

interface Comment {
  id: string;
  body: string;
  is_deleted: boolean;
  created_at: string;
  profiles: {
    username: string;
  } | null;
  episodes: {
    episode_number: number;
    stories: {
      title: string;
    };
  } | null;
}

export function CommentModerator() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/comments');
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleSoftDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/comments?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // Toggle state locally
        setComments(prev =>
          prev.map(c => (c.id === id ? { ...c, is_deleted: true } : c))
        );
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch('/api/admin/comments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, is_deleted: false }),
      });
      if (res.ok) {
        setComments(prev =>
          prev.map(c => (c.id === id ? { ...c, is_deleted: false } : c))
        );
      }
    } catch (err) {
      console.error('Error restoring comment:', err);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-h2 font-bebas text-brand-primary tracking-wider uppercase">
          Comment Moderation
        </h2>
        <p className="text-body-default text-text-secondary mt-1">
          Review and moderate reader comments across all story episodes
        </p>
      </div>

      <div className="rounded-xl border border-border-custom bg-surface overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-text-muted text-caption flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
            <span>Retrieving comments feed...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-16 text-center text-text-muted text-caption flex flex-col items-center justify-center gap-3">
            <MessageSquare className="w-8 h-8 text-text-muted" />
            <span>No comments posted by readers yet.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-small">
              <thead>
                <tr className="border-b border-border-custom bg-background/50 text-text-secondary font-semibold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Reader</th>
                  <th className="p-4">Story & Episode</th>
                  <th className="p-4">Comment Text</th>
                  <th className="p-4">Posted Date</th>
                  <th className="p-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom/50">
                {comments.map((comment) => (
                  <tr
                    key={comment.id}
                    className={`transition-colors hover:bg-surface-hover/10 ${
                      comment.is_deleted ? 'bg-status-error/5 text-text-muted' : ''
                    }`}
                  >
                    <td className="p-4 font-semibold text-text-primary">
                      {comment.profiles?.username || 'Deleted User'}
                    </td>
                    <td className="p-4">
                      {comment.episodes ? (
                        <div>
                          <span className="block font-semibold text-text-primary">
                            {comment.episodes.stories?.title}
                          </span>
                          <span className="block text-[11px] text-text-muted mt-0.5">
                            Episode {comment.episodes.episode_number}
                          </span>
                        </div>
                      ) : (
                        <span className="text-text-muted">Orphaned Episode</span>
                      )}
                    </td>
                    <td className="p-4 max-w-xs sm:max-w-md md:max-w-lg break-words">
                      {comment.is_deleted ? (
                        <span className="italic flex items-center gap-1.5 text-status-error">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          [This comment has been soft-deleted by moderator]
                        </span>
                      ) : (
                        comment.body
                      )}
                    </td>
                    <td className="p-4 text-text-muted font-mono text-[11px]">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      {comment.is_deleted ? (
                        <button
                          onClick={() => handleRestore(comment.id)}
                          className="px-3 py-1.5 rounded bg-background hover:bg-status-success/15 border border-border-custom hover:border-status-success/40 text-text-secondary hover:text-status-success transition-all cursor-pointer inline-flex items-center gap-1.5 text-caption font-bold uppercase tracking-wider"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSoftDelete(comment.id)}
                          className="px-3 py-1.5 rounded bg-background hover:bg-status-error/15 border border-border-custom hover:border-status-error/40 text-text-secondary hover:text-status-error transition-all cursor-pointer inline-flex items-center gap-1.5 text-caption font-bold uppercase tracking-wider"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Flag/Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
