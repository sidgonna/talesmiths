'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { useAdmin } from '@/components/providers/AdminProvider';
import Image from 'next/image';
import { User, BookOpen, Search, LogOut } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function Navbar() {
  const pathname = usePathname();
  const supabase = useSupabase();
  const { setIsAdminOpen } = useAdmin();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  const longPressedRef = useRef(false);

  const startPress = () => {
    longPressedRef.current = false;
    setIsPressing(true);
    pressTimerRef.current = setTimeout(() => {
      setIsAdminOpen(true);
      longPressedRef.current = true;
      setIsPressing(false);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(100);
      }
    }, 3000);
  };

  const cancelPress = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setIsPressing(false);
  };

  useEffect(() => {
    // Clean up timer on unmount
    return () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    };
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-custom bg-background/80 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo / Brand Name */}
        <div className="flex items-center gap-6">
          <div 
            onMouseDown={startPress}
            onMouseUp={cancelPress}
            onMouseLeave={cancelPress}
            onTouchStart={startPress}
            onTouchEnd={cancelPress}
            className={`transition-all duration-300 ${
              isPressing ? 'opacity-50 scale-95' : ''
            }`}
          >
            <Link 
              href="/" 
              onClick={(e) => {
                if (longPressedRef.current) {
                  e.preventDefault();
                }
              }}
            >
              <div className="relative w-60 h-16 flex items-center justify-center cursor-pointer">
                <Image 
                  src="/logo-transparent.png" 
                  alt="Tale Smiths Logo" 
                  fill 
                  className="object-contain" 
                  priority 
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`text-body-default transition-colors duration-200 ${
                isActive('/')
                  ? 'text-brand-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Home
            </Link>
            <Link
              href="/stories"
              className={`text-body-default transition-colors duration-200 ${
                isActive('/stories')
                  ? 'text-brand-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Stories
            </Link>
          </nav>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-4">
          <Link
            href="/search"
            className="p-2 rounded-lg bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border-custom transition-all duration-200"
            aria-label="Search stories"
          >
            <Search className="w-5 h-5" />
          </Link>

          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/profile"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-custom bg-surface hover:bg-surface-hover transition-colors duration-200 ${
                      pathname.startsWith('/profile')
                        ? 'text-brand-primary border-brand-primary/50'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="text-small hidden sm:inline max-w-[120px] truncate">
                      {user.user_metadata?.username || user.email?.split('@')[0]}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg bg-surface hover:bg-accent-blood-red/10 text-text-secondary hover:text-accent-blood-red border border-border-custom hover:border-accent-blood-red/20 transition-all duration-200"
                    aria-label="Log out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <Link
                  href={`/login?next=${encodeURIComponent(pathname)}`}
                  className="px-4 py-2 text-small font-semibold rounded-lg bg-accent-blood-red hover:bg-accent-hover-crimson text-text-primary transition-all duration-200 shadow-lg shadow-accent-blood-red/10 focus:outline-none focus:ring-2 focus:ring-accent-blood-red/50"
                >
                  Log In
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
