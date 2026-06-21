import { NextResponse } from 'next/server';
import { checkIsAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

// 1. GET: Fetch all stories (including drafts / order control)
export async function GET() {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: stories, error } = await supabase
      .from('stories')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ stories });
  } catch (error) {
    console.error('Fetch stories error:', error);
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
  }
}

// 2. POST: Create a new story
export async function POST(request: Request) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      slug,
      title,
      description,
      cover_url,
      genre_tags,
      status,
      read_mode,
      direction,
      universe_tag,
      is_featured,
      display_order,
    } = body;

    if (!slug || !title) {
      return NextResponse.json({ error: 'Slug and Title are required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: story, error } = await supabase
      .from('stories')
      .insert({
        slug: slug.toLowerCase().trim(),
        title: title.trim(),
        description: description?.trim(),
        cover_url,
        genre_tags: genre_tags || [],
        status: status || 'ongoing',
        read_mode: read_mode || 'vertical',
        direction: direction || 'ltr',
        universe_tag: universe_tag?.trim() || null,
        is_featured: !!is_featured,
        display_order: Number(display_order) || 0,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, story });
  } catch (error: any) {
    console.error('Create story error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Story slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create story' }, { status: 500 });
  }
}

// 3. PUT: Update an existing story
export async function PUT(request: Request) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      slug,
      title,
      description,
      cover_url,
      genre_tags,
      status,
      read_mode,
      direction,
      universe_tag,
      is_featured,
      display_order,
    } = body;

    if (!id || !slug || !title) {
      return NextResponse.json({ error: 'ID, Slug, and Title are required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: story, error } = await supabase
      .from('stories')
      .update({
        slug: slug.toLowerCase().trim(),
        title: title.trim(),
        description: description?.trim(),
        cover_url,
        genre_tags: genre_tags || [],
        status: status || 'ongoing',
        read_mode: read_mode || 'vertical',
        direction: direction || 'ltr',
        universe_tag: universe_tag?.trim() || null,
        is_featured: !!is_featured,
        display_order: Number(display_order) || 0,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, story });
  } catch (error: any) {
    console.error('Update story error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Story slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update story' }, { status: 500 });
  }
}

// 4. DELETE: Delete a story (Supabase schema cascades this to episodes/panels)
export async function DELETE(request: Request) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete story error:', error);
    return NextResponse.json({ error: 'Failed to delete story' }, { status: 500 });
  }
}
