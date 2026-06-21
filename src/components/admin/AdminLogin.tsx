'use client';

import { useState } from 'react';
import { useAdmin } from '@/components/providers/AdminProvider';
import { KeyRound, Loader2, AlertCircle } from 'lucide-react';

export function AdminLogin() {
  const { loginAdmin } = useAdmin();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const success = await loginAdmin(password);
      if (!success) {
        setErrorMsg('Invalid creator password.');
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl border border-border-custom bg-surface shadow-2xl flex flex-col items-center gap-6 animate-scale-up">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
        <KeyRound className="w-7 h-7" />
      </div>

      <div className="text-center">
        <h2 className="text-h2 font-bebas text-brand-primary tracking-wider uppercase">
          Creator Portal
        </h2>
        <p className="text-body-default text-text-secondary mt-1">
          Enter password to access publisher console
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 mt-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="admin-password" className="text-small font-semibold text-text-secondary">
            Creator Password
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-lg bg-background border border-border-custom text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary transition-all text-center tracking-widest font-mono"
            required
            autoFocus
          />
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded bg-status-error/10 border border-status-error/25 text-status-error text-caption">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-accent-blood-red hover:bg-accent-hover-crimson text-small font-bold uppercase tracking-wider text-text-primary transition-colors cursor-pointer shadow-lg shadow-accent-blood-red/10 flex items-center justify-center gap-2 focus:outline-none disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Unlock Console'
          )}
        </button>
      </form>
    </div>
  );
}
