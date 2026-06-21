import { getStoryBySlug, getEpisodes } from '@/lib/db';
import { Navbar } from '@/components/ui/Navbar';
import { MobileNav } from '@/components/ui/MobileNav';
import { EpisodeList } from '@/components/story/EpisodeList';
import { StoryActions } from '@/components/story/StoryActions';
import { Footer } from '@/components/ui/Footer';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Compass, BookOpen, ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface StoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: StoryPageProps) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  
  if (!story) return { title: 'Story Not Found' };
  
  return {
    title: `${story.title} — Tale Smiths`,
    description: story.description || `Read ${story.title} on Tale Smiths.`,
  };
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);

  if (!story) {
    notFound();
  }

  const episodes = await getEpisodes(story.id);
  const firstEpisode = episodes.find(e => e.episode_number === 1) || episodes[0];

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar />

      {/* Comic Series JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ComicSeries',
            'name': story.title,
            'description': story.description || '',
            'image': story.cover_url || '',
            'genre': story.genre_tags,
            'creativeWorkStatus': story.status,
            'publisher': {
              '@type': 'Organization',
              'name': 'Tale Smiths',
            }
          })
        }}
      />

      <main className="flex-1 pb-24 md:pb-12">
        {/* Back Link */}
        <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-small text-text-secondary hover:text-text-primary transition-colors duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to collection
          </Link>
        </div>

        {/* Hero Header Section */}
        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Story Cover */}
            <div className="w-full md:w-64 shrink-0 aspect-[3/4] rounded-xl overflow-hidden border border-border-custom bg-surface relative shadow-xl">
              {story.cover_url ? (
                <img
                  src={story.cover_url}
                  alt={story.title}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-text-muted bg-radial-gradient from-surface-hover to-background">
                  <BookOpen className="w-12 h-12 text-text-muted mb-2" />
                  <span className="text-caption font-semibold uppercase tracking-wider text-brand-primary/70">
                    {story.title}
                  </span>
                </div>
              )}
            </div>

            {/* Story Info */}
            <div className="flex-1 flex flex-col items-start gap-4">
              {story.universe_tag && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                  {story.universe_tag}
                </span>
              )}

              <h1 className="text-h2 text-brand-primary leading-tight select-none uppercase">
                {story.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-caption font-semibold tracking-wider uppercase bg-surface border border-border-custom text-text-secondary">
                  {story.status}
                </span>
                
                <span className="inline-flex items-center gap-1 text-caption text-text-muted">
                  {story.read_mode === 'vertical' ? (
                    <>
                      <Compass className="w-4 h-4 text-brand-primary" />
                      Scroll Mode
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4 text-brand-primary" />
                      Page Mode
                    </>
                  )}
                </span>
              </div>

              {story.description && (
                <p className="text-body-default text-text-secondary leading-relaxed max-w-2xl mt-1">
                  {story.description}
                </p>
              )}

              {/* Genre Tags */}
              <div className="flex flex-wrap gap-2 mt-1">
                {story.genre_tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded text-caption text-text-muted bg-surface border border-border-custom"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Call to Actions */}
              <StoryActions story={story} firstEpisodeSlug={firstEpisode?.slug} />
            </div>
          </div>

          {/* Episode List Section */}
          <div className="mt-12">
            <EpisodeList story={story} episodes={episodes} />
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Sticky Mobile Nav */}
      <MobileNav />
    </div>
  );
}
