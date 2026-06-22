import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Load Bebas Neue font
    const fontBebas = await fetch(
      new URL('https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIgDu0GC_qBFGPjoJ6SBAyM.ttf')
    ).then((res) => res.arrayBuffer());

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let episode: any = null;
    let story: any = null;

    if (supabaseUrl && anonKey) {
      // 1. Fetch Episode details
      const epResponse = await fetch(
        `${supabaseUrl}/rest/v1/episodes?id=eq.${id}&select=*`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
        }
      );
      
      if (epResponse.ok) {
        const epData = await epResponse.json();
        if (epData && epData.length > 0) {
          episode = epData[0];
          
          // 2. Fetch Story details using parent story_id
          const storyResponse = await fetch(
            `${supabaseUrl}/rest/v1/stories?id=eq.${episode.story_id}&select=*`,
            {
              headers: {
                apikey: anonKey,
                Authorization: `Bearer ${anonKey}`,
              },
            }
          );
          if (storyResponse.ok) {
            const storyData = await storyResponse.json();
            if (storyData && storyData.length > 0) {
              story = storyData[0];
            }
          }
        }
      }
    }

    // Fallbacks for offline / local testing
    if (!episode || !story) {
      episode = {
        episode_number: 1,
        title: 'New Release',
      };
      story = {
        title: 'Tale Smiths Story',
        cover_url: null,
      };
    }

    const storyTitle = story.title || 'Tale Smiths';
    const episodeTitle = episode.title 
      ? `Ep ${episode.episode_number}: ${episode.title}` 
      : `Episode ${episode.episode_number}`;
    const coverUrl = story.cover_url || '';

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
          {/* Dark Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.8) 40%, rgba(10,10,10,0.4) 100%)',
            }}
          />

          {/* Tale Smiths wordmark */}
          <div
            style={{
              position: 'absolute',
              top: '40px',
              left: '60px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'Bebas Neue',
                fontSize: '28px',
                color: '#A8A29E',
                letterSpacing: '0.1em',
              }}
            >
              Tale Smiths
            </span>
          </div>

          {/* Story Title context */}
          <div
            style={{
              display: 'flex',
              padding: '4px 12px',
              borderRadius: '4px',
              border: '1px solid rgba(214, 186, 138, 0.2)',
              backgroundColor: '#141414',
              color: '#D6BA8A',
              fontSize: '14px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '16px',
              zIndex: 10,
            }}
          >
            {storyTitle}
          </div>

          {/* Episode Title */}
          <span
            style={{
              fontFamily: 'Bebas Neue',
              fontSize: '76px',
              color: '#F3E9D2',
              lineHeight: 0.95,
              letterSpacing: '0.02em',
              marginBottom: '24px',
              zIndex: 10,
              textTransform: 'uppercase',
            }}
          >
            {episodeTitle}
          </span>

          {/* Read CTA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              zIndex: 10,
            }}
          >
            <span style={{ fontSize: '18px', color: '#A8A29E' }}>
              Now available to read for free.
            </span>
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
              Read Episode
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
    console.error('Error generating Episode OG image:', err);
    return new Response('Failed to generate image', { status: 500 });
  }
}
