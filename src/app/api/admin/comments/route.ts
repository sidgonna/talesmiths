import { NextResponse } from 'next/server';
import { checkIsAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

// 1. GET: Fetch recent comments for moderation
export async function GET() {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        id,
        body,
        is_deleted,
        created_at,
        profiles (username),
        episodes (
          episode_number,
          stories (title)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Fetch comments error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// 2. PUT: Update comment (e.g. toggle is_deleted to restore)
export async function PUT(request: Request) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, is_deleted } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('comments')
      .update({ is_deleted: !!is_deleted })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update comment error:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

// 3. DELETE: Soft delete a comment (set is_deleted = true)
export async function DELETE(request: Request) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('comments')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Soft delete comment error:', error);
    return NextResponse.json({ error: 'Failed to soft delete comment' }, { status: 500 });
  }
}
