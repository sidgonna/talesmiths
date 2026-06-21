'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { Comment, Profile } from '@/types';
import { MessageSquare, Trash2, CornerDownRight, ArrowRight, Loader2, Send } from 'lucide-react';

interface EpisodeCommentsProps {
  episodeId: string;
}

export function EpisodeComments({ episodeId }: EpisodeCommentsProps) {
  const pathname = usePathname();
  const supabase = useSupabase();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<Profile | null>(null);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [submitting, setSubmitting] = useState(false);



  // Load user session
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        setSessionUser(data);
      }
    };
    fetchSession();
  }, [supabase]);

  // Load comments
  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles:profile_id(*)')
        .eq('episode_id', episodeId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Build threaded structure
      const commentMap: Record<string, Comment & { replies: Comment[] }> = {};
      const roots: Comment[] = [];

      data.forEach((c: any) => {
        commentMap[c.id] = { ...c, replies: [] };
      });

      data.forEach((c: any) => {
        const mapped = commentMap[c.id];
        if (c.parent_id && commentMap[c.parent_id]) {
          commentMap[c.parent_id].replies.push(mapped);
        } else {
          roots.push(mapped);
        }
      });

      setComments(roots);
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  }, [episodeId, supabase]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Submit comment/reply
  const handleSubmitComment = async (parentId: string | null = null) => {
    const body = parentId ? replyBody : newCommentBody;
    if (!body.trim()) return;
    if (!sessionUser) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          profile_id: sessionUser.id,
          episode_id: episodeId,
          parent_id: parentId,
          body: body.trim(),
        });

      if (error) throw error;

      if (parentId) {
        setReplyBody('');
        setReplyingToId(null);
      } else {
        setNewCommentBody('');
      }
      
      // Refresh
      fetchComments();
    } catch (err) {
      console.error('Error submitting comment:', err);
      alert('Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id)
        .eq('profile_id', sessionUser?.id);

      if (error) throw error;
      fetchComments();
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment.');
    }
  };

  return (
    <div className="w-full border-2 border-border-custom bg-surface p-6 rounded-xl shadow-[4px_4px_0px_0px_var(--border-custom)] flex flex-col gap-6">
      <div className="flex items-center gap-2 border-b border-border-custom pb-3">
        <MessageSquare className="w-5 h-5 text-brand-primary" />
        <h3 className="text-h3 font-bebas text-brand-primary uppercase tracking-wider">
          Reader Discussion
        </h3>
      </div>

      {/* Input box */}
      {sessionUser ? (
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full border-2 border-border-custom bg-background shrink-0 overflow-hidden flex items-center justify-center">
            {sessionUser.avatar_url ? (
              <img src={sessionUser.avatar_url} alt={sessionUser.username} className="w-full h-full object-cover" />
            ) : (
              <div className="text-[14px] font-bold text-brand-primary uppercase">
                {sessionUser.username[0]}
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-3">
            <textarea
              value={newCommentBody}
              onChange={(e) => setNewCommentBody(e.target.value)}
              rows={3}
              placeholder="Join the discussion... Share your thoughts!"
              className="w-full px-4 py-2.5 rounded-lg bg-background border border-border-custom text-text-primary focus:outline-none focus:border-brand-primary transition-all resize-none text-small"
            />
            <button
              onClick={() => handleSubmitComment(null)}
              disabled={submitting}
              className="self-end px-4 py-2 rounded-lg bg-accent-blood-red hover:bg-accent-hover-crimson text-text-primary text-caption font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000000]"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Post Comment
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-background border border-border-custom text-center">
          <p className="text-small text-text-secondary">
            Join the conversation! Please{' '}
            <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="text-brand-primary hover:underline font-bold">
              Log In
            </Link>{' '}
            or{' '}
            <Link href={`/signup?next=${encodeURIComponent(pathname)}`} className="text-brand-primary hover:underline font-bold">
              Sign Up
            </Link>{' '}
            to write comments.
          </p>
        </div>
      )}

      {/* Discussion List */}
      {loading ? (
        <div className="py-8 text-center text-text-muted flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
          <span className="text-caption">Unfolding scrolls...</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="py-12 text-center text-text-muted text-caption border border-dashed border-border-custom rounded-lg bg-background/50">
          No comments yet. Be the first to share your thoughts!
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex flex-col gap-3 pb-4 border-b border-border-custom/50 last:border-b-0 last:pb-0">
              <div className="flex gap-3 items-start">
                {/* Author Avatar */}
                <div className="w-9 h-9 rounded-full border-2 border-border-custom bg-background shrink-0 overflow-hidden flex items-center justify-center select-none">
                  {comment.profiles?.avatar_url ? (
                    <img src={comment.profiles.avatar_url} alt={comment.profiles.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-caption font-bold text-brand-primary uppercase">
                      {comment.profiles?.username?.[0] || '?'}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-caption font-bold text-brand-primary">
                      {comment.profiles?.username || 'Deleted User'}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {new Date(comment.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-small text-text-primary mt-1 leading-relaxed break-words pr-2">
                    {comment.body}
                  </p>

                  <div className="flex items-center gap-4 mt-2 select-none">
                    {sessionUser && (
                      <button
                        onClick={() => {
                          setReplyingToId(comment.id);
                          setReplyBody('');
                        }}
                        className="text-[10px] font-bold uppercase tracking-wider text-text-secondary hover:text-brand-primary cursor-pointer transition-colors"
                      >
                        Reply
                      </button>
                    )}
                    {sessionUser && sessionUser.id === comment.profile_id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-[10px] font-bold uppercase tracking-wider text-status-error/80 hover:text-status-error cursor-pointer transition-colors flex items-center gap-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Nested Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="pl-6 sm:pl-10 flex flex-col gap-3 mt-1">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-2.5 items-start bg-background/30 p-2.5 rounded-lg border border-border-custom/30">
                      <CornerDownRight className="w-3.5 h-3.5 text-text-muted mt-1 shrink-0" />
                      <div className="w-7 h-7 rounded-full border-2 border-border-custom bg-background shrink-0 overflow-hidden flex items-center justify-center select-none">
                        {reply.profiles?.avatar_url ? (
                          <img src={reply.profiles.avatar_url} alt={reply.profiles.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-[10px] font-bold text-brand-primary uppercase">
                            {reply.profiles?.username?.[0] || '?'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[11px] font-bold text-brand-primary">
                            {reply.profiles?.username || 'Deleted User'}
                          </span>
                          <span className="text-[9px] text-text-muted">
                            {new Date(reply.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-small text-text-primary mt-0.5 leading-relaxed break-words pr-2">
                          {reply.body}
                        </p>
                        {sessionUser && sessionUser.id === reply.profile_id && (
                          <button
                            onClick={() => handleDeleteComment(reply.id)}
                            className="text-[10px] font-bold uppercase tracking-wider text-status-error/80 hover:text-status-error cursor-pointer mt-1.5 transition-colors flex items-center gap-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input Box */}
              {replyingToId === comment.id && (
                <div className="pl-6 sm:pl-10 mt-2 flex gap-3 items-start animate-fade-in">
                  <div className="flex-1 flex flex-col gap-2">
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      rows={2}
                      placeholder={`Reply to ${comment.profiles?.username}...`}
                      className="w-full px-3 py-2 rounded bg-background border border-border-custom text-text-primary focus:outline-none focus:border-brand-primary transition-all resize-none text-small"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setReplyingToId(null)}
                        className="px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSubmitComment(comment.id)}
                        disabled={submitting || !replyBody.trim()}
                        className="px-3 py-1.5 rounded bg-accent-blood-red hover:bg-accent-hover-crimson text-text-primary text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shadow-[1px_1px_0px_0px_#000000]"
                      >
                        {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                        Submit
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
