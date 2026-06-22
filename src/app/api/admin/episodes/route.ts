import { NextResponse } from 'next/server';
import { checkIsAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { deleteFromR2 } from '@/lib/r2/upload';

// 1. GET: Fetch all episodes for a story, including nested panels
export async function GET(request: Request) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('story_id');
    const episodeId = searchParams.get('id');

    const supabase = createAdminClient();

    if (episodeId) {
      // Fetch a single episode and its panels
      const { data: episode, error } = await supabase
        .from('episodes')
        .select(`
          *,
          panels (*)
        `)
        .eq('id', episodeId)
        .single();

      if (error) throw error;
      
      // Sort panels client-side to ensure display_order is correct
      if (episode && episode.panels) {
        episode.panels.sort((a: any, b: any) => a.display_order - b.display_order);
      }

      return NextResponse.json({ episode });
    }

    if (!storyId) {
      return NextResponse.json({ error: 'story_id or id parameter is required' }, { status: 400 });
    }

    // Fetch all episodes for the story
    const { data: episodes, error } = await supabase
      .from('episodes')
      .select(`
        *,
        panels (*)
      `)
      .eq('story_id', storyId)
      .order('episode_number', { ascending: true });

    if (error) throw error;

    // Sort panels for each episode
    episodes?.forEach((ep: any) => {
      if (ep.panels) {
        ep.panels.sort((a: any, b: any) => a.display_order - b.display_order);
      }
    });

    return NextResponse.json({ episodes });
  } catch (error) {
    console.error('Fetch episodes error:', error);
    return NextResponse.json({ error: 'Failed to fetch episodes' }, { status: 500 });
  }
}

// 2. POST: Create a new episode + panels
export async function POST(request: Request) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      story_id,
      episode_number,
      title,
      slug,
      read_mode,
      direction,
      status,
      panels, // Array of: { r2_key, cdn_url, display_order, width, height }
    } = body;

    if (!story_id || episode_number === undefined || !slug) {
      return NextResponse.json({ error: 'Story ID, Episode Number, and Slug are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Insert Episode
    const { data: episode, error: epError } = await supabase
      .from('episodes')
      .insert({
        story_id,
        episode_number: Number(episode_number),
        title: title?.trim() || null,
        slug: slug.toLowerCase().trim(),
        read_mode: read_mode || null,
        direction: direction || null,
        status: status || 'draft',
        published_at: status === 'published' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (epError) throw epError;

    // Insert Panels if provided
    if (panels && Array.isArray(panels) && panels.length > 0) {
      const panelsToInsert = panels.map((panel: any) => ({
        episode_id: episode.id,
        r2_key: panel.r2_key,
        cdn_url: panel.cdn_url,
        display_order: Number(panel.display_order),
        width: panel.width ? Number(panel.width) : null,
        height: panel.height ? Number(panel.height) : null,
      }));

      const { error: panelError } = await supabase
        .from('panels')
        .insert(panelsToInsert);

      if (panelError) {
        // If panel insert fails, clean up the episode so we don't have partial inserts
        await supabase.from('episodes').delete().eq('id', episode.id);
        throw panelError;
      }
    }

    return NextResponse.json({ success: true, episode_id: episode.id });
  } catch (error: any) {
    console.error('Create episode error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Episode number or slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create episode' }, { status: 500 });
  }
}

// 3. PUT: Update episode metadata + replace panels (for simplicity in re-ordering)
export async function PUT(request: Request) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      episode_number,
      title,
      slug,
      read_mode,
      direction,
      status,
      panels, // Array of: { r2_key, cdn_url, display_order, width, height }
    } = body;

    if (!id || episode_number === undefined || !slug) {
      return NextResponse.json({ error: 'ID, Episode Number, and Slug are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Fetch current status to check transition
    const { data: currentEp } = await supabase.from('episodes').select('status').eq('id', id).single();
    let publishedAtVal = undefined;
    if (status === 'published' && currentEp?.status !== 'published') {
      publishedAtVal = new Date().toISOString();
    }

    // 2. Update Episode
    const { error: epError } = await supabase
      .from('episodes')
      .update({
        episode_number: Number(episode_number),
        title: title?.trim() || null,
        slug: slug.toLowerCase().trim(),
        read_mode: read_mode || null,
        direction: direction || null,
        status: status,
        ...(publishedAtVal && { published_at: publishedAtVal }),
      })
      .eq('id', id);

    if (epError) throw epError;

    // 3. Update Panels (Delete old ones, insert new ones to support order changes cleanly)
    if (panels && Array.isArray(panels)) {
      // Fetch existing panel keys before deleting them
      const { data: existingPanels, error: fetchPanelsError } = await supabase
        .from('panels')
        .select('r2_key')
        .eq('episode_id', id);

      if (fetchPanelsError) throw fetchPanelsError;

      // Delete existing records from the database
      const { error: deleteError } = await supabase
        .from('panels')
        .delete()
        .eq('episode_id', id);

      if (deleteError) throw deleteError;

      // Insert new panels if there are any left
      if (panels.length > 0) {
        const panelsToInsert = panels.map((panel: any) => ({
          episode_id: id,
          r2_key: panel.r2_key,
          cdn_url: panel.cdn_url,
          display_order: Number(panel.display_order),
          width: panel.width ? Number(panel.width) : null,
          height: panel.height ? Number(panel.height) : null,
        }));

        const { error: panelError } = await supabase
          .from('panels')
          .insert(panelsToInsert);

        if (panelError) throw panelError;
      }

      // Clean up physical panel objects in Cloudflare R2 that are no longer part of this episode
      if (existingPanels && existingPanels.length > 0) {
        const newKeys = new Set(panels.map((p: any) => p.r2_key).filter(Boolean));
        const keysToDelete = existingPanels
          .map((p) => p.r2_key)
          .filter((k) => k && !newKeys.has(k));

        if (keysToDelete.length > 0) {
          for (const key of keysToDelete) {
            try {
              await deleteFromR2(key);
            } catch (r2Error) {
              console.error(`Failed to clean up orphaned panel "${key}" from R2:`, r2Error);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update episode error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Episode number or slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update episode' }, { status: 500 });
  }
}

// 4. DELETE: Delete an episode (cascade deletes panels)
export async function DELETE(request: Request) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Episode ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Fetch the episode's panels first to get their R2 storage keys
    const { data: panels, error: fetchError } = await supabase
      .from('panels')
      .select('r2_key')
      .eq('episode_id', id);

    if (fetchError) throw fetchError;

    // 2. Delete the episode from Supabase (cascades DB deletions to the panels table)
    const { error: deleteError } = await supabase
      .from('episodes')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // 3. Delete the associated physical panel images from Cloudflare R2
    if (panels && panels.length > 0) {
      for (const panel of panels) {
        if (panel.r2_key) {
          try {
            await deleteFromR2(panel.r2_key);
          } catch (r2Error) {
            console.error(`Failed to delete panel object "${panel.r2_key}" from R2:`, r2Error);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete episode error:', error);
    return NextResponse.json({ error: 'Failed to delete episode' }, { status: 500 });
  }
}
