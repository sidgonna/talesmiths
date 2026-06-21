'use client';

import { useState } from 'react';
import { Mail, Loader2, Check } from 'lucide-react';

export function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setEmail('');
      } else {
        setErrorMsg(data.error || 'Failed to subscribe.');
      }
    } catch (err) {
      setErrorMsg('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm flex flex-col gap-2">
      <h4 className="text-small font-bold uppercase tracking-wider text-brand-primary">
        Subscribe for Updates
      </h4>
      <p className="text-[11px] text-text-secondary leading-relaxed">
        Be the first to read new chapters of Mahakala and discover upcoming releases.
      </p>

      {success ? (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-status-success/15 border border-status-success/20 text-status-success text-[12px] animate-scale-up">
          <Check className="w-4 h-4 shrink-0" />
          <span>You have been subscribed! Thank you.</span>
        </div>
      ) : (
        <form onSubmit={handleSubscribe} className="flex gap-2 mt-1">
          <div className="relative flex-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full pl-9 pr-3 py-2 text-caption rounded bg-background/50 border border-border-custom text-text-primary focus:outline-none focus:border-brand-primary placeholder:text-text-muted transition-all"
              required
              disabled={loading}
            />
            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded bg-accent-blood-red hover:bg-accent-hover-crimson text-[11px] font-bold uppercase tracking-wider text-text-primary transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-accent-blood-red/10"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Join'}
          </button>
        </form>
      )}

      {errorMsg && !success && (
        <p className="text-[10px] text-status-error font-medium animate-pulse mt-0.5">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
