-- ==========================================
-- TALE SMITHS DATABASE SCHEMA
-- Copy and paste this into the Supabase SQL Editor
-- ==========================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Clean up existing triggers/functions if any
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.update_updated_at_column();

-- Create update timestamp function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- ==========================================
-- 1. PROFILES TABLE
-- ==========================================
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    username text unique,
    avatar_url text,
    theme text default 'system' check (theme in ('light', 'dark', 'system')),
    default_mode text default 'vertical' check (default_mode in ('vertical', 'horizontal')),
    is_admin boolean default false,
    created_at timestamptz default now() not null
);

-- RLS for Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone" 
    on public.profiles for select 
    using (true);

create policy "Users can update their own profile" 
    on public.profiles for update 
    using (auth.uid() = id);

-- Trigger to automatically create profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, username, avatar_url, theme, default_mode, is_admin)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1) || '_' || substr(md5(random()::text), 1, 5)),
        new.raw_user_meta_data->>'avatar_url',
        'system',
        'vertical',
        false
    );
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();


-- ==========================================
-- 2. STORIES TABLE
-- ==========================================
create table if not exists public.stories (
    id uuid default uuid_generate_v4() primary key,
    slug text unique not null,
    title text not null,
    description text,
    cover_url text,
    genre_tags text[] default '{}'::text[] not null,
    status text default 'ongoing' check (status in ('ongoing', 'completed', 'hiatus')) not null,
    read_mode text default 'vertical' check (read_mode in ('vertical', 'horizontal')) not null,
    direction text default 'ltr' check (direction in ('ltr', 'rtl')) not null,
    universe_tag text,
    is_featured boolean default false,
    display_order integer default 0,
    published_at timestamptz default now(),
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- RLS for Stories
alter table public.stories enable row level security;

create policy "Stories are viewable by everyone" 
    on public.stories for select 
    using (true);

create policy "Stories can only be modified by admins" 
    on public.stories for all 
    using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.is_admin = true
        )
    );

create trigger update_stories_updated_at
    before update on public.stories
    for each row execute procedure public.update_updated_at_column();


-- ==========================================
-- 3. EPISODES TABLE
-- ==========================================
create table if not exists public.episodes (
    id uuid default uuid_generate_v4() primary key,
    story_id uuid references public.stories(id) on delete cascade not null,
    episode_number integer not null,
    title text,
    slug text not null,
    read_mode text check (read_mode in ('vertical', 'horizontal')),
    direction text check (direction in ('ltr', 'rtl')),
    status text default 'draft' check (status in ('draft', 'published', 'scheduled')) not null,
    scheduled_at timestamptz,
    published_at timestamptz default now(),
    view_count integer default 0 not null,
    like_count integer default 0 not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    unique(story_id, slug),
    unique(story_id, episode_number)
);

-- RLS for Episodes
alter table public.episodes enable row level security;

create policy "Published episodes are viewable by everyone" 
    on public.episodes for select 
    using (status = 'published');

create policy "Admins can view all episodes" 
    on public.episodes for select 
    using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.is_admin = true
        )
    );

create policy "Episodes can only be modified by admins" 
    on public.episodes for all 
    using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.is_admin = true
        )
    );

create trigger update_episodes_updated_at
    before update on public.episodes
    for each row execute procedure public.update_updated_at_column();


-- ==========================================
-- 4. PANELS TABLE (Manga Pages)
-- ==========================================
create table if not exists public.panels (
    id uuid default uuid_generate_v4() primary key,
    episode_id uuid references public.episodes(id) on delete cascade not null,
    r2_key text not null,
    cdn_url text not null,
    display_order integer not null,
    width integer,
    height integer,
    created_at timestamptz default now() not null
);

-- RLS for Panels
alter table public.panels enable row level security;

create policy "Panels are viewable by everyone" 
    on public.panels for select 
    using (
        exists (
            select 1 from public.episodes 
            where episodes.id = panels.episode_id and episodes.status = 'published'
        )
        or
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.is_admin = true
        )
    );

create policy "Panels can only be modified by admins" 
    on public.panels for all 
    using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.is_admin = true
        )
    );


-- ==========================================
-- 5. EPISODE READS TABLE (Progress Tracking)
-- ==========================================
create table if not exists public.episode_reads (
    id uuid default uuid_generate_v4() primary key,
    profile_id uuid references public.profiles(id) on delete cascade not null,
    episode_id uuid references public.episodes(id) on delete cascade not null,
    story_id uuid references public.stories(id) on delete cascade not null,
    progress double precision default 0.0 not null,
    current_page integer default 0 not null,
    completed boolean default false not null,
    last_read_at timestamptz default now() not null,
    unique(profile_id, episode_id)
);

-- RLS for Episode Reads
alter table public.episode_reads enable row level security;

create policy "Users can view their own reading progress" 
    on public.episode_reads for select 
    using (auth.uid() = profile_id);

create policy "Users can insert/update their own reading progress" 
    on public.episode_reads for all 
    using (auth.uid() = profile_id);


-- ==========================================
-- 6. STORY BOOKMARKS TABLE
-- ==========================================
create table if not exists public.story_bookmarks (
    id uuid default uuid_generate_v4() primary key,
    profile_id uuid references public.profiles(id) on delete cascade not null,
    story_id uuid references public.stories(id) on delete cascade not null,
    created_at timestamptz default now() not null,
    unique(profile_id, story_id)
);

-- RLS for Bookmarks
alter table public.story_bookmarks enable row level security;

create policy "Users can view their own bookmarks" 
    on public.story_bookmarks for select 
    using (auth.uid() = profile_id);

create policy "Users can manage their own bookmarks" 
    on public.story_bookmarks for all 
    using (auth.uid() = profile_id);


-- ==========================================
-- 7. LIKES TABLE
-- ==========================================
create table if not exists public.likes (
    id uuid default uuid_generate_v4() primary key,
    profile_id uuid references public.profiles(id) on delete cascade not null,
    episode_id uuid references public.episodes(id) on delete cascade not null,
    created_at timestamptz default now() not null,
    unique(profile_id, episode_id)
);

-- RLS for Likes
alter table public.likes enable row level security;

create policy "Users can view their own likes" 
    on public.likes for select 
    using (auth.uid() = profile_id);

create policy "Users can manage their own likes" 
    on public.likes for all 
    using (auth.uid() = profile_id);


-- ==========================================
-- 8. COMMENTS TABLE (Visible to everyone, login to post)
-- ==========================================
create table if not exists public.comments (
    id uuid default uuid_generate_v4() primary key,
    profile_id uuid references public.profiles(id) on delete cascade not null,
    episode_id uuid references public.episodes(id) on delete cascade not null,
    parent_id uuid references public.comments(id) on delete cascade,
    body text not null,
    is_deleted boolean default false not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- RLS for Comments
alter table public.comments enable row level security;

create policy "Comments are viewable by everyone" 
    on public.comments for select 
    using (true);

create policy "Authenticated users can insert comments" 
    on public.comments for insert 
    with check (auth.role() = 'authenticated' and auth.uid() = profile_id);

create policy "Users can update their own comments" 
    on public.comments for update 
    using (auth.uid() = profile_id);

create trigger update_comments_updated_at
    before update on public.comments
    for each row execute procedure public.update_updated_at_column();


-- ==========================================
-- 9. EMAIL SUBSCRIBERS TABLE (No auth needed to insert)
-- ==========================================
create table if not exists public.email_subscribers (
    id uuid default uuid_generate_v4() primary key,
    email text unique not null,
    story_ids uuid[] default '{}'::uuid[] not null,
    confirmed boolean default false not null,
    confirm_token text,
    created_at timestamptz default now() not null
);

-- RLS for Email Subscribers
alter table public.email_subscribers enable row level security;

create policy "Subscribers can insert their own email" 
    on public.email_subscribers for insert 
    with check (true);

create policy "Admins can view and manage subscribers" 
    on public.email_subscribers for all 
    using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.is_admin = true
        )
    );


-- ==========================================
-- 10. ANALYTICS EVENTS TABLE
-- ==========================================
create table if not exists public.analytics_events (
    id uuid default uuid_generate_v4() primary key,
    event_type text not null, -- 'page_view', 'episode_read', etc.
    story_id uuid references public.stories(id) on delete set null,
    episode_id uuid references public.episodes(id) on delete set null,
    profile_id uuid references public.profiles(id) on delete set null,
    referrer text,
    user_agent text,
    created_at timestamptz default now() not null
);

-- RLS for Analytics
alter table public.analytics_events enable row level security;

create policy "Everyone can insert analytics events" 
    on public.analytics_events for insert 
    with check (true);

create policy "Admins can view analytics events" 
    on public.analytics_events for select 
    using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.is_admin = true
        )
    );
