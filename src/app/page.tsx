import { getStories } from '@/lib/db';
import { Navbar } from '@/components/ui/Navbar';
import { HeroBanner } from '@/components/home/HeroBanner';
import { StoriesBrowser } from '@/components/home/StoriesBrowser';
import { MobileNav } from '@/components/ui/MobileNav';
import { Footer } from '@/components/ui/Footer';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const stories = await getStories();
  
  // Find first featured story, fallback to first story in the list
  const featuredStory = stories.find((story) => story.is_featured) || stories[0] || null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Areas */}
      <main className="flex-1 flex flex-col pb-16 md:pb-0">
        {/* Featured Hero Banner */}
        <HeroBanner featuredStory={featuredStory} />

        {/* Stories Browser with Interactive Filter Grid */}
        <StoriesBrowser initialStories={stories} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Sticky Mobile Nav Bar */}
      <MobileNav />
    </div>
  );
}
