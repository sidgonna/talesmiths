import { Story, Episode, Panel } from '@/types';

export const MOCK_STORIES: Story[] = [
  {
    id: 'story-mahakala',
    slug: 'mahakala',
    title: 'MAHAKALA',
    description: 'Somewhere far from our universe, in a world forgotten by time where Gods once walked, a sage along with his disciples walk towards an ancient destroyed temple. They find a door that opens with a mystic power, leading to the location of the manuscript. The fate of this world will be decided when they find SHEROK.',
    cover_url: '/images/mahakala_cover.png',
    genre_tags: ['Fantasy', 'Action', 'Mythology'],
    status: 'ongoing',
    read_mode: 'vertical',
    direction: 'ltr',
    universe_tag: 'Mahakala Universe',
    is_featured: true,
    display_order: 1,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'story-nebula',
    slug: 'nebula-echoes',
    title: 'Nebula Echoes',
    description: 'An AI-generated space opera exploration story focusing on the quiet, haunting sounds of the cosmos and the travelers who seek their origin.',
    cover_url: null,
    genre_tags: ['Sci-Fi', 'Mystery'],
    status: 'ongoing',
    read_mode: 'horizontal',
    direction: 'ltr',
    universe_tag: null,
    is_featured: false,
    display_order: 2,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const MOCK_EPISODES: Record<string, Episode[]> = {
  'story-mahakala': [
    {
      id: 'ep-mahakala-1',
      story_id: 'story-mahakala',
      episode_number: 1,
      title: 'The Destroyed Temple',
      slug: 'episode-1-the-destroyed-temple',
      read_mode: 'vertical',
      direction: 'ltr',
      status: 'published',
      scheduled_at: null,
      published_at: new Date().toISOString(),
      view_count: 1420,
      like_count: 532,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'ep-mahakala-2',
      story_id: 'story-mahakala',
      episode_number: 2,
      title: 'Finding Sherok',
      slug: 'episode-2-finding-sherok',
      read_mode: 'horizontal', // Horizontal mode override test case
      direction: 'ltr',
      status: 'published',
      scheduled_at: null,
      published_at: new Date().toISOString(),
      view_count: 820,
      like_count: 312,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  'story-nebula': [
    {
      id: 'ep-nebula-1',
      story_id: 'story-nebula',
      episode_number: 1,
      title: 'First Signal',
      slug: 'episode-1-first-signal',
      read_mode: 'horizontal',
      direction: 'ltr',
      status: 'published',
      scheduled_at: null,
      published_at: new Date().toISOString(),
      view_count: 340,
      like_count: 98,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
};

export const MOCK_PANELS: Record<string, Panel[]> = {
  'ep-mahakala-1': [
    {
      id: 'panel-m1-1',
      episode_id: 'ep-mahakala-1',
      r2_key: '',
      cdn_url: '/images/mahakala_panel_1.png',
      display_order: 1,
      width: 1200,
      height: 1800,
      created_at: new Date().toISOString()
    },
    {
      id: 'panel-m1-2',
      episode_id: 'ep-mahakala-1',
      r2_key: '',
      cdn_url: '/images/mahakala_panel_2.png',
      display_order: 2,
      width: 1200,
      height: 1800,
      created_at: new Date().toISOString()
    }
  ],
  'ep-mahakala-2': [
    {
      id: 'panel-m2-1',
      episode_id: 'ep-mahakala-2',
      r2_key: '',
      cdn_url: '/images/mahakala_panel_2.png',
      display_order: 1,
      width: 1200,
      height: 1800,
      created_at: new Date().toISOString()
    },
    {
      id: 'panel-m2-2',
      episode_id: 'ep-mahakala-2',
      r2_key: '',
      cdn_url: '/images/mahakala_panel_1.png',
      display_order: 2,
      width: 1200,
      height: 1800,
      created_at: new Date().toISOString()
    }
  ],
  'ep-nebula-1': [
    {
      id: 'panel-n1-1',
      episode_id: 'ep-nebula-1',
      r2_key: '',
      cdn_url: '/images/mahakala_panel_1.png',
      display_order: 1,
      width: 1200,
      height: 1800,
      created_at: new Date().toISOString()
    }
  ]
};
