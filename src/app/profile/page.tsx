import { Navbar } from '@/components/ui/Navbar';
import { MobileNav } from '@/components/ui/MobileNav';
import { ProfileView } from '@/components/profile/ProfileView';
import { Footer } from '@/components/ui/Footer';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Profile | Tale Smiths',
  description: 'Manage your Tale Smiths reading shelf, library bookmarks, stats, and preferences.',
};

export default function ProfilePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary transition-colors duration-200">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Profile Shell */}
      <main className="flex-1 pb-24 md:pb-16 bg-radial-gradient from-surface-hover/10 via-transparent to-transparent">
        <ProfileView />
      </main>

      {/* Footer */}
      <Footer />

      {/* Navigation Footer */}
      <MobileNav />
    </div>
  );
}
