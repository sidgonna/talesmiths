import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { Story, Episode, Panel } from '@/types';

const isServer = typeof window === 'undefined';

async function getSupabaseClient() {
  if (isServer) {
    return await createServerClient();
  } else {
    return createClient();
  }
}

export async function getStories(): Promise<Story[]> {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error || !data) {
      return [];
    }
    return data as Story[];
  } catch (err) {
    console.error('Error fetching stories:', err);
    return [];
  }
}

export async function getStoryBySlug(slug: string): Promise<Story | null> {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data as Story;
  } catch (err) {
    console.error('Error fetching story by slug:', err);
    return null;
  }
}

export async function getEpisodes(storyId: string): Promise<Episode[]> {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('episodes')
      .select('*')
      .eq('story_id', storyId)
      .order('episode_number', { ascending: true });

    if (error || !data) {
      return [];
    }
    return data as Episode[];
  } catch (err) {
    console.error('Error fetching episodes:', err);
    return [];
  }
}

export async function getEpisodeBySlug(storyId: string, slug: string): Promise<Episode | null> {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('episodes')
      .select('*')
      .eq('story_id', storyId)
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data as Episode;
  } catch (err) {
    console.error('Error fetching episode by slug:', err);
    return null;
  }
}

export async function getPanels(episodeId: string): Promise<Panel[]> {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('panels')
      .select('*')
      .eq('episode_id', episodeId)
      .order('display_order', { ascending: true });

    if (error || !data) {
      return [];
    }
    return data as Panel[];
  } catch (err) {
    console.error('Error fetching panels:', err);
    return [];
  }
}
