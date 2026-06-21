import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { MOCK_STORIES, MOCK_EPISODES, MOCK_PANELS } from '@/lib/mockData';
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

    if (error || !data || data.length === 0) {
      return MOCK_STORIES;
    }
    return data as Story[];
  } catch (err) {
    console.error('Error fetching stories:', err);
    return MOCK_STORIES;
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
      return MOCK_STORIES.find((s) => s.slug === slug) ?? null;
    }
    return data as Story;
  } catch (err) {
    console.error('Error fetching story by slug:', err);
    return MOCK_STORIES.find((s) => s.slug === slug) ?? null;
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

    if (error || !data || data.length === 0) {
      // Fallback matching logic (either by UUID storyId or slug mapping)
      const mockStory = MOCK_STORIES.find(s => s.id === storyId || s.slug === storyId);
      return mockStory ? (MOCK_EPISODES[mockStory.id] ?? []) : [];
    }
    return data as Episode[];
  } catch (err) {
    console.error('Error fetching episodes:', err);
    const mockStory = MOCK_STORIES.find(s => s.id === storyId || s.slug === storyId);
    return mockStory ? (MOCK_EPISODES[mockStory.id] ?? []) : [];
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
      const mockStory = MOCK_STORIES.find(s => s.id === storyId || s.slug === storyId);
      if (!mockStory) return null;
      return MOCK_EPISODES[mockStory.id]?.find((e) => e.slug === slug) ?? null;
    }
    return data as Episode;
  } catch (err) {
    console.error('Error fetching episode by slug:', err);
    const mockStory = MOCK_STORIES.find(s => s.id === storyId || s.slug === storyId);
    if (!mockStory) return null;
    return MOCK_EPISODES[mockStory.id]?.find((e) => e.slug === slug) ?? null;
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

    if (error || !data || data.length === 0) {
      return MOCK_PANELS[episodeId] ?? [];
    }
    return data as Panel[];
  } catch (err) {
    console.error('Error fetching panels:', err);
    return MOCK_PANELS[episodeId] ?? [];
  }
}
