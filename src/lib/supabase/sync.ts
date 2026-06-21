import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Syncs locally saved anonymous reading progress to the Supabase cloud database upon login.
 * Trashed/cleared locally once successfully updated in the DB.
 */
export async function syncLocalProgress(supabase: SupabaseClient, userId: string) {
  try {
    const localData = localStorage.getItem('talesmiths-reading-progress');
    if (!localData) return;

    const parsed = JSON.parse(localData);
    const entries = Object.entries(parsed);
    if (entries.length === 0) return;

    const upserts = entries
      .map(([episodeId, val]: [string, any]) => {
        // Ensure we have a valid story_id; ignore any malformed local progress items
        if (!val.story_id) return null;

        return {
          profile_id: userId,
          episode_id: episodeId,
          story_id: val.story_id,
          progress: val.progress || 0,
          current_page: val.current_page || 0,
          completed: (val.progress || 0) >= 0.95,
          last_read_at: val.lastRead || new Date().toISOString()
        };
      })
      .filter((item): item is Exclude<typeof item, null> => item !== null);

    if (upserts.length > 0) {
      const { error } = await supabase
        .from('episode_reads')
        .upsert(upserts, { onConflict: 'profile_id,episode_id' });

      if (error) {
        console.error('Error syncing local progress to Supabase:', error);
        return;
      }
    }

    // Success - clear localStorage cache
    localStorage.removeItem('talesmiths-reading-progress');
  } catch (err) {
    console.error('Failed to run progress sync logic:', err);
  }
}
