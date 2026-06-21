'use client';

import { useState, useEffect } from 'react';
import { Book, Film, Eye, Heart, BarChart3, MessageSquare, Plus, ArrowRight } from 'lucide-react';

interface StatsSummary {
  totalViews: number;
  totalReads: number;
}

interface PopularEpisode {
  id: string;
  episode_number: number;
  title: string;
  view_count: number;
  like_count: number;
  stories: {
    title: string;
  };
}

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [popular, setPopular] = useState<PopularEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [storiesCount, setStoriesCount] = useState(0);
  const [episodesCount, setEpisodesCount] = useState(0);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Fetch analytics
        const resAnalytics = await fetch('/api/admin/analytics');
        if (resAnalytics.ok) {
          const analyticsData = await resAnalytics.json();
          setStats(analyticsData.summary);
          setPopular(analyticsData.popularEpisodes);
        }

        // Fetch stories & calculate counts
        const resStories = await fetch('/api/admin/stories');
        if (resStories.ok) {
          const storiesData = await resStories.json();
          setStoriesCount(storiesData.stories?.length || 0);

          // Get total episodes count from nested fetch
          let totalEps = 0;
          for (const story of storiesData.stories || []) {
            const resEps = await fetch(`/api/admin/episodes?story_id=${story.id}`);
            if (resEps.ok) {
              const epsData = await resEps.json();
              totalEps += epsData.episodes?.length || 0;
            }
          }
          setEpisodesCount(totalEps);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const cards = [
    {
      title: 'Total Stories',
      value: storiesCount,
      icon: Book,
      color: 'text-brand-primary',
      bg: 'bg-brand-primary/5',
      action: () => onNavigate('stories'),
      actionLabel: 'Manage stories',
    },
    {
      title: 'Total Episodes',
      value: episodesCount,
      icon: Film,
      color: 'text-brand-primary',
      bg: 'bg-brand-primary/5',
      action: () => onNavigate('episodes'),
      actionLabel: 'Manage episodes',
    },
    {
      title: 'Total Story Views',
      value: stats?.totalViews || 0,
      icon: Eye,
      color: 'text-status-info',
      bg: 'bg-status-info/5',
      action: () => onNavigate('analytics'),
      actionLabel: 'View analytics',
    },
    {
      title: 'Total Episode Reads',
      value: stats?.totalReads || 0,
      icon: BarChart3,
      color: 'text-brand-primary',
      bg: 'bg-brand-primary/5',
      action: () => onNavigate('analytics'),
      actionLabel: 'Check traffic sources',
    },
  ];

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-h2 font-bebas text-brand-primary tracking-wider uppercase">
          Dashboard Overview
        </h2>
        <p className="text-body-default text-text-secondary mt-1">
          Real-time summary of Tale Smiths content and readership metrics
        </p>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="p-5 rounded-xl border border-border-custom bg-surface flex flex-col justify-between gap-4 group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-caption text-text-muted font-medium">{card.title}</span>
                  <p className="text-h2 font-bebas text-text-primary mt-1 tracking-wide">
                    {loading ? '...' : card.value}
                  </p>
                </div>
                <div className={`p-2.5 rounded-lg ${card.bg} ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <button
                onClick={card.action}
                className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-brand-primary hover:text-brand-dark transition-colors border-t border-border-custom/50 pt-3 text-left w-full cursor-pointer"
              >
                <span>{card.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Popular Content */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-border-custom bg-surface flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border-custom pb-4">
            <h3 className="text-h3 font-bebas text-brand-primary tracking-wider uppercase">
              Popular Episodes
            </h3>
            <span className="text-caption text-text-muted">By view count</span>
          </div>

          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="py-8 text-center text-text-muted text-caption">Loading popular content...</div>
            ) : popular.length === 0 ? (
              <div className="py-8 text-center text-text-muted text-caption">No readership data available yet.</div>
            ) : (
              popular.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background border border-border-custom/50 hover:border-border-custom transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-small flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-body-default font-semibold text-text-primary">
                        {item.stories?.title} — Ep {item.episode_number}
                      </h4>
                      <p className="text-caption text-text-muted mt-0.5">
                        {item.title || 'Untitled Episode'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-caption text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-text-muted" />
                      <span>{item.view_count}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-status-error" />
                      <span>{item.like_count}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 rounded-xl border border-border-custom bg-surface flex flex-col gap-4">
          <div className="border-b border-border-custom pb-4">
            <h3 className="text-h3 font-bebas text-brand-primary tracking-wider uppercase">
              Quick Creator Actions
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => onNavigate('stories')}
              className="w-full flex items-center justify-between p-4 rounded-lg bg-background border border-border-custom hover:border-brand-primary/50 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-brand-primary" />
                <div>
                  <span className="text-body-default font-semibold text-text-primary">New Story</span>
                  <p className="text-[11px] text-text-muted mt-0.5">Create a new manga series</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate('episodes')}
              className="w-full flex items-center justify-between p-4 rounded-lg bg-background border border-border-custom hover:border-brand-primary/50 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-brand-primary" />
                <div>
                  <span className="text-body-default font-semibold text-text-primary">Add Episode</span>
                  <p className="text-[11px] text-text-muted mt-0.5">Upload new panels to a story</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate('comments')}
              className="w-full flex items-center justify-between p-4 rounded-lg bg-background border border-border-custom hover:border-brand-primary/50 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-brand-primary" />
                <div>
                  <span className="text-body-default font-semibold text-text-primary">Moderate Comments</span>
                  <p className="text-[11px] text-text-muted mt-0.5">Review and delete comments</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
