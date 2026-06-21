export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  theme: 'light' | 'dark' | 'system';
  default_mode: 'vertical' | 'horizontal';
  is_admin: boolean;
  created_at: string;
}

export interface Story {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  genre_tags: string[];
  status: 'ongoing' | 'completed' | 'hiatus';
  read_mode: 'vertical' | 'horizontal';
  direction: 'ltr' | 'rtl';
  universe_tag: string | null;
  is_featured: boolean;
  display_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: string;
  story_id: string;
  episode_number: number;
  title: string | null;
  slug: string;
  read_mode: 'vertical' | 'horizontal' | null;
  direction: 'ltr' | 'rtl' | null;
  status: 'draft' | 'published' | 'scheduled';
  scheduled_at: string | null;
  published_at: string | null;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  stories?: Story; // Joined story relation if queried
}

export interface Panel {
  id: string;
  episode_id: string;
  r2_key: string;
  cdn_url: string;
  display_order: number;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface Comment {
  id: string;
  profile_id: string;
  episode_id: string;
  parent_id: string | null;
  body: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile; // Joined author profile
  replies?: Comment[]; // Threaded replies
}

export interface EpisodeRead {
  id: string;
  profile_id: string;
  episode_id: string;
  story_id: string;
  progress: number;
  current_page: number;
  completed: boolean;
  last_read_at: string;
}
