'use client';

import { useState, useRef, useEffect } from 'react';
import { Story, Episode } from '@/types';
import { ShareCard } from '@/components/share/ShareCard';
import { X, Copy, Download, Share2, Check, AlertCircle } from 'lucide-react';
import { toPng } from 'html-to-image';

interface ShareModalProps {
  story: Story;
  episode?: Episode;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ story, episode, isOpen, onClose }: ShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [shareSupported, setShareSupported] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compute share text and link
  const shareTitle = episode 
    ? `Read ${story.title} - Episode ${episode.episode_number} on Tale Smiths!`
    : `Read ${story.title} on Tale Smiths!`;
  const shareText = episode
    ? `Currently reading ${story.title} Ep ${episode.episode_number}: "${episode.title || ''}"`
    : `Check out this amazing story "${story.title}" on Tale Smiths!`;
    
  const shareUrl = typeof window !== 'undefined'
    ? (episode 
        ? `${window.location.origin}/stories/${story.slug}/${episode.slug}`
        : `${window.location.origin}/stories/${story.slug}`)
    : '';

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      setShareSupported(true);
    }
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      setErrorMsg('Failed to copy link.');
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    setErrorMsg(null);

    try {
      // Small timeout to allow DOM layout to settle during download trigger
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 1.5, // Enhances target clarity without inflating file size
        style: {
          transform: 'scale(1)', // Temporarily reset scale override during capture
          transformOrigin: 'top left',
        }
      });

      const filename = episode 
        ? `${story.slug}-ep${episode.episode_number}-share.png`
        : `${story.slug}-share.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download card rendering failed:', err);
      setErrorMsg('Failed to render share card image.');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setDownloading(false);
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
    } catch (err) {
      // Ignore abort errors from user dismissals
      if ((err as Error).name !== 'AbortError') {
        console.error('Error triggering Web Share API:', err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none">
      {/* Click backdrop to close */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg rounded-2xl border border-border-custom bg-surface p-6 shadow-2xl flex flex-col items-center gap-6 animate-scale-up z-10">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-background hover:bg-surface-hover border border-border-custom text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Close share dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center">
          <h3 className="text-h3 text-brand-primary uppercase tracking-wider">
            Share Story
          </h3>
          <p className="text-caption text-text-secondary mt-0.5">
            Save a branded card for Instagram or copy the link
          </p>
        </div>

        {/* Card preview render section */}
        <div className="w-full flex justify-center py-2 relative">
          <ShareCard story={story} episode={episode} cardRef={cardRef} />
        </div>

        {/* Error notification display */}
        {errorMsg && (
          <div className="w-full flex items-center gap-2 p-3 rounded bg-status-error/10 border border-status-error/25 text-status-error text-caption">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Share Action Grid */}
        <div className="grid grid-cols-2 gap-3 w-full mt-2">
          {/* Action 1: Save Card */}
          <button
            onClick={handleDownloadCard}
            disabled={downloading}
            className="flex items-center justify-center gap-2 py-3 rounded-lg border border-border-custom bg-background hover:bg-surface-hover text-small font-semibold text-text-primary transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-brand-primary" />
            {downloading ? 'Rendering...' : 'Save Card'}
          </button>

          {/* Action 2: Copy Link */}
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 py-3 rounded-lg border border-border-custom bg-background hover:bg-surface-hover text-small font-semibold text-text-primary transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-status-success animate-pulse" />
                <span className="text-status-success">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-brand-primary" />
                Copy Link
              </>
            )}
          </button>

          {/* Action 3: Native Share (Full width if Web Share is supported, else hidden) */}
          {shareSupported && (
            <button
              onClick={handleNativeShare}
              className="col-span-2 flex items-center justify-center gap-2 py-3 rounded-lg bg-accent-blood-red hover:bg-accent-hover-crimson text-small font-bold uppercase tracking-wider text-text-primary transition-colors cursor-pointer shadow-lg shadow-accent-blood-red/10 focus:outline-none focus:ring-2 focus:ring-accent-blood-red/50"
            >
              <Share2 className="w-4 h-4" />
              Share on Socials
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
