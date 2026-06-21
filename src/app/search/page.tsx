import { getStories } from '@/lib/db';
import { Navbar } from '@/components/ui/Navbar';
import { SearchContainer } from '@/components/search/SearchContainer';
import { MobileNav } from '@/components/ui/MobileNav';
import { Footer } from '@/components/ui/Footer';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Search Webcomics & Manga — Tale Smiths',
  description: 'Search and filter the complete collection of immersive webcomics and AI-generated manga series on Tale Smiths.',
};

export default async function SearchPage() {
  const stories = await getStories();

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Browse Directory */}
      <main className="flex-1 w-full bg-background transition-colors duration-200">
        <SearchContainer initialStories={stories} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Sticky Nav */}
      <MobileNav />
    </div>
  );
}
