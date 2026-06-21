import { getStories } from '@/lib/db';
import { Navbar } from '@/components/ui/Navbar';
import { StoriesBrowser } from '@/components/home/StoriesBrowser';
import { MobileNav } from '@/components/ui/MobileNav';
import { Footer } from '@/components/ui/Footer';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Manga Directory — Tale Smiths',
  description: 'Browse the complete collection of immersive webcomics and AI-generated manga series on Tale Smiths.',
};

export default async function StoriesPage() {
  const stories = await getStories();

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Browse Directory */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 pb-24 md:pb-12">
        <div className="mb-6">
          <h1 className="text-h2 text-brand-primary uppercase">
            All Manga Series
          </h1>
          <p className="text-body-default text-text-secondary mt-1">
            Browse our complete library of original AI comic series
          </p>
        </div>

        {/* Stories Browser with filters */}
        <StoriesBrowser initialStories={stories} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Sticky Nav */}
      <MobileNav />
    </div>
  );
}
