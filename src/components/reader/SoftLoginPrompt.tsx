'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Sparkles } from 'lucide-react';
import { useSupabase } from '@/components/providers/SupabaseProvider';

interface SoftLoginPromptProps {
  episodeNumber: number;
  progress: number; // 0.0 -> 1.0
}

export function SoftLoginPrompt({ episodeNumber, progress }: SoftLoginPromptProps) {
  const [show, setShow] = useState(false);
  const supabase = useSupabase();

  useEffect(() => {
    // Check if the user is already authenticated
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) return; // User is logged in, no prompt needed

      // Check if prompt was already shown/dismissed during this session
      const dismissed = sessionStorage.getItem('talesmiths-login-prompt-dismissed');
      if (dismissed === 'true') return;

      // Trigger condition: User completes Episode 1 (progress reaches 95% or more)
      if (episodeNumber === 1 && progress >= 0.95) {
        setShow(true);
      }
    };

    checkUser();
  }, [episodeNumber, progress, supabase]);

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('talesmiths-login-prompt-dismissed', 'true');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-[350px] z-40 p-4 rounded-xl border border-brand-primary/30 bg-surface shadow-2xl shadow-black/50 animate-slide-up select-none">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-brand-primary">
          <Sparkles className="w-5 h-5 shrink-0 animate-pulse" />
          <h4 className="text-small font-bold uppercase tracking-wider">
            Save Your Progress!
          </h4>
        </div>
        <button
          onClick={handleDismiss}
          className="text-text-muted hover:text-text-primary transition-colors duration-150 p-1"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-caption text-text-secondary mt-2 leading-relaxed">
        If you liked reading this episode, log in or sign up to save your reading history, track progress, and comment.
      </p>

      <div className="flex items-center gap-3 mt-4">
        <Link
          href="/login"
          className="flex-1 text-center py-2 rounded-lg bg-accent-blood-red hover:bg-accent-hover-crimson text-text-primary text-[11px] font-bold uppercase tracking-wider transition-colors duration-200"
        >
          Log In
        </Link>
        <Link
          href="/signup"
          onClick={handleDismiss}
          className="flex-1 text-center py-2 rounded-lg border border-border-custom bg-background hover:bg-surface-hover text-text-secondary hover:text-text-primary text-[11px] font-bold uppercase tracking-wider transition-colors duration-200"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
