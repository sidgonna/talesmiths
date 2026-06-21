import { NextResponse } from 'next/server';
import { checkIsAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // 1. Fetch total page views and episode reads counts
    const { count: totalViews } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'page_view');

    const { count: totalReads } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'episode_read');

    // 2. Fetch popular episodes based on direct DB counts (efficient and reliable)
    const { data: popularEpisodes, error: popErr } = await supabase
      .from('episodes')
      .select(`
        id,
        episode_number,
        title,
        view_count,
        like_count,
        stories (title)
      `)
      .order('view_count', { ascending: false })
      .limit(10);

    if (popErr) console.error('Error fetching popular episodes:', popErr);

    // 3. Fetch recent events to aggregate referrers (e.g. tracking Instagram traffic)
    const { data: recentEvents, error: eventsErr } = await supabase
      .from('analytics_events')
      .select('referrer')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (eventsErr) console.error('Error fetching referrers:', eventsErr);

    const referrers: Record<string, number> = {};
    recentEvents?.forEach((ev: any) => {
      const ref = ev.referrer?.trim();
      if (ref) {
        let label = ref;
        // Parse hostname if it's a URL
        if (ref.startsWith('http://') || ref.startsWith('https://')) {
          try {
            label = new URL(ref).hostname;
          } catch (_) {}
        }
        referrers[label] = (referrers[label] || 0) + 1;
      } else {
        referrers['Direct / Social (Instagram Bio/App)'] = (referrers['Direct / Social (Instagram Bio/App)'] || 0) + 1;
      }
    });

    return NextResponse.json({
      summary: {
        totalViews: totalViews || 0,
        totalReads: totalReads || 0,
      },
      popularEpisodes: popularEpisodes || [],
      referrers,
    });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
