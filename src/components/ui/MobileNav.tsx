'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Search, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';

export function MobileNav() {
  const pathname = usePathname();
  const supabase = useSupabase();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Stories', path: '/stories', icon: BookOpen },
    { label: 'Search', path: '/search', icon: Search },
    { label: 'Profile', path: isLoggedIn ? '/profile' : '/login', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 block md:hidden bg-background/95 backdrop-blur-md border-t border-border-custom px-4 py-2 safe-bottom transition-colors duration-200">
      <div className="flex items-center justify-around h-12">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.label}
              href={item.path}
              className={`flex flex-col items-center justify-center w-14 h-full gap-0.5 transition-colors duration-200 ${
                active
                  ? 'text-brand-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-caption font-medium text-[10px] tracking-normal">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
