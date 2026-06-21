'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/components/providers/AdminProvider';

export default function AdminGatePage() {
  const { setIsAdminOpen } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    setIsAdminOpen(true);
    router.replace('/');
  }, [setIsAdminOpen, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-text-secondary select-none">
      <div className="text-center animate-pulse">
        <p className="font-bebas text-h2 tracking-widest text-brand-primary">
          Opening Admin Gate...
        </p>
      </div>
    </div>
  );
}
