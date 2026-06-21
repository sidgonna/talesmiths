import { getStoryBySlug, getEpisodeBySlug, getEpisodes, getPanels } from '@/lib/db';
import { ReaderView } from '@/components/reader/ReaderView';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface EpisodePageProps {
  params: Promise<{
    slug: string;
    episode: string;
  }>;
}

export async function generateMetadata({ params }: EpisodePageProps) {
  const { slug, episode } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) return { title: 'Story Not Found' };

  const currentEpisode = await getEpisodeBySlug(story.id, episode);
  if (!currentEpisode) return { title: 'Episode Not Found' };

  const episodeLabel = currentEpisode.title 
    ? `Ep ${currentEpisode.episode_number}: ${currentEpisode.title}`
    : `Episode ${currentEpisode.episode_number}`;

  return {
    title: `${story.title} — ${episodeLabel} | Tale Smiths`,
    description: `Read ${story.title} ${episodeLabel} in vertical scroll or horizontal page-flip format.`,
  };
}

export default async function EpisodePage({ params }: EpisodePageProps) {
  const { slug, episode } = await params;

  // Fetch story details
  const story = await getStoryBySlug(slug);
  if (!story) {
    notFound();
  }

  // Fetch all episodes for navigation controls
  const allEpisodes = await getEpisodes(story.id);

  // Fetch active episode details
  const currentEpisode = await getEpisodeBySlug(story.id, episode);
  if (!currentEpisode) {
    notFound();
  }

  // Fetch active episode panel images
  const panels = await getPanels(currentEpisode.id);

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-hidden">
      {/* Comic Story JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ComicStory',
            'name': currentEpisode.title ? `Episode ${currentEpisode.episode_number}: ${currentEpisode.title}` : `Episode ${currentEpisode.episode_number}`,
            'description': `Read Episode ${currentEpisode.episode_number} of ${story.title} on Tale Smiths.`,
            'isPartOf': {
              '@type': 'ComicSeries',
              'name': story.title,
              'url': `https://talesmiths.com/stories/${story.slug}`
            },
            'publisher': {
              '@type': 'Organization',
              'name': 'Tale Smiths'
            }
          })
        }}
      />

      {/* Immersive Reader View Container */}
      <ReaderView
        story={story}
        currentEpisode={currentEpisode}
        allEpisodes={allEpisodes}
        panels={panels}
      />
    </div>
  );
}
