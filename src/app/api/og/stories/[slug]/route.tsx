import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Load Bebas Neue font for logo and titles
    const fontBebas = await fetch(
      new URL('https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIgDu0GC_qBFGPjoJ6SBAyM.ttf')
    ).then((res) => res.arrayBuffer());

    // Fetch story from Supabase REST endpoint directly (lightweight, no cookies, Edge-safe)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let story: any = null;

    if (supabaseUrl && anonKey) {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/stories?slug=eq.${slug}&select=*`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          story = data[0];
        }
      }
    }

    // Fallback if Supabase is offline or not seeded
    if (!story) {
      story = {
        title: slug.toUpperCase().replace(/-/g, ' '),
        description: 'Explore this original AI-generated manga series on Tale Smiths.',
        cover_url: null,
        genre_tags: ['Manga', 'Comics'],
        status: 'ongoing',
      };
    }

    const title = story.title || 'Tale Smiths';
    const description = story.description || 'Explore original AI manga and comics.';
    const coverUrl = story.cover_url || '';
    const genres = story.genre_tags || [];
    const status = story.status || 'ongoing';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            backgroundColor: '#0A0A0A',
            backgroundImage: coverUrl ? `url(${coverUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: '60px',
            position: 'relative',
          }}
        >
          {/* Dark Overlay gradient */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.8) 40%, rgba(10,10,10,0.4) 100%)',
            }}
          />

          {/* Tale Smiths wordmark top-left */}
          <div
            style={{
              position: 'absolute',
              top: '40px',
              left: '60px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                fontFamily: 'Bebas Neue',
                fontSize: '32px',
                color: '#D6BA8A',
                letterSpacing: '0.1em',
              }}
            >
              Tale Smiths
            </span>
          </div>

          {/* Featured badge */}
          <div
            style={{
              display: 'flex',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid rgba(214, 186, 138, 0.3)',
              backgroundColor: '#0A0A0A',
              color: '#D6BA8A',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '16px',
              zIndex: 10,
            }}
          >
            Original Series • {status}
          </div>

          {/* Title */}
          <span
            style={{
              fontFamily: 'Bebas Neue',
              fontSize: '84px',
              color: '#D6BA8A',
              lineHeight: 0.9,
              letterSpacing: '0.02em',
              marginBottom: '16px',
              zIndex: 10,
              textTransform: 'uppercase',
            }}
          >
            {title}
          </span>

          {/* Description */}
          <p
            style={{
              fontSize: '22px',
              color: '#A8A29E',
              lineHeight: 1.4,
              maxWidth: '800px',
              margin: '0 0 24px 0',
              zIndex: 10,
            }}
          >
            {description.length > 150 ? `${description.substring(0, 150)}...` : description}
          </p>

          {/* Genres Footer & Read CTA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              {genres.map((tag: string) => (
                <span
                  key={tag}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '4px',
                    border: '1px solid #2A2A2A',
                    backgroundColor: '#141414',
                    color: '#F3E9D2',
                    fontSize: '14px',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                padding: '12px 28px',
                borderRadius: '8px',
                backgroundColor: '#8B0000',
                color: '#F3E9D2',
                fontSize: '16px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Read Now
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Bebas Neue',
            data: fontBebas,
            style: 'normal',
          },
        ],
      }
    );
  } catch (err) {
    console.error('Error generating OG image:', err);
    return new Response('Failed to generate image', { status: 500 });
  }
}
