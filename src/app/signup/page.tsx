'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { syncLocalProgress } from '@/lib/supabase/sync';
import { Navbar } from '@/components/ui/Navbar';
import { MobileNav } from '@/components/ui/MobileNav';
import { Sparkles, Mail, Lock, User, AlertCircle } from 'lucide-react';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabase();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [oauthLoading, setOauthLoading] = useState(false);

  const redirectTo = searchParams.get('next') || '/profile';

  // Redirect if already authenticated
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push(redirectTo);
      } else {
        setCheckingAuth(false);
      }
    });
  }, [supabase, router, redirectTo]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (username.trim().length < 3) {
      setErrorMsg('Username must be at least 3 characters long.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim(),
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        await syncLocalProgress(supabase, data.user.id);
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setErrorMsg(null);
    setOauthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) {
        setErrorMsg(error.message);
        setOauthLoading(false);
      }
    } catch (err) {
      setErrorMsg('OAuth initialization error occurred.');
      setOauthLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin mb-4" />
        <span className="text-caption font-semibold tracking-widest uppercase text-brand-primary">
          Authenticating...
        </span>
      </div>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16 pb-24 md:pb-16 bg-radial-gradient from-surface-hover/10 via-transparent to-transparent">
      <div className="w-full max-w-md p-8 rounded-2xl border border-border-custom bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-brand-primary/20 bg-background text-caption text-brand-primary uppercase tracking-wider font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-brand-primary animate-pulse" />
            Join Tale Smiths
          </div>
          <h1 className="text-h2 text-brand-primary uppercase tracking-wider">
            Sign Up
          </h1>
          <p className="text-small text-text-secondary">
            Create an account to save progress and bookmarks
          </p>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-4 mb-6 rounded-lg bg-status-error/10 border border-status-error/25 text-status-error text-small">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleSignup}
          disabled={oauthLoading || loading}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-lg border border-border-custom bg-background hover:bg-surface-hover transition-colors text-small font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 cursor-pointer disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {oauthLoading ? 'Initializing...' : 'Continue with Google'}
        </button>

        {/* Separator */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-border-custom"></div>
          <span className="px-3 text-caption text-text-muted uppercase tracking-wider font-semibold">
            or continue with
          </span>
          <div className="flex-1 border-t border-border-custom"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-caption font-bold text-text-secondary uppercase tracking-wide">
              Username
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                required
                placeholder="talesmith"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border-custom bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary transition-colors text-small"
              />
              <User className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-caption font-bold text-text-secondary uppercase tracking-wide">
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border-custom bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary transition-colors text-small"
              />
              <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-caption font-bold text-text-secondary uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border-custom bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary transition-colors text-small"
              />
              <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || oauthLoading}
            className="w-full mt-2 py-3 rounded-lg bg-accent-blood-red hover:bg-accent-hover-crimson disabled:bg-surface-hover disabled:text-text-muted text-text-primary text-small font-bold uppercase tracking-wider transition-all duration-200 shadow-lg shadow-accent-blood-red/10 focus:outline-none focus:ring-2 focus:ring-accent-blood-red/50 cursor-pointer"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-border-custom/50 text-center text-small text-text-secondary">
          Already have an account?{' '}
          <Link
            href={`/login${searchParams.toString() ? '?' + searchParams.toString() : ''}`}
            className="font-bold text-brand-primary hover:text-brand-dark transition-colors duration-150"
          >
            Log In
          </Link>
        </div>
      </div>
    </main>
  );
}

import { Footer } from '@/components/ui/Footer';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary transition-colors duration-200">
      <Navbar />
      <Suspense fallback={
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin mb-4" />
          <span className="text-caption font-semibold tracking-widest uppercase text-brand-primary">
            Loading...
          </span>
        </div>
      }>
        <SignupForm />
      </Suspense>
      <Footer />
      <MobileNav />
    </div>
  );
}
