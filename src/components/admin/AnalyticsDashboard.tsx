'use client';

import { useState, useEffect } from 'react';
import { Eye, BookOpen, Share2, BarChart2, TrendingUp, Globe, Loader2 } from 'lucide-react';

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

interface AnalyticsData {
  summary: StatsSummary;
  popularEpisodes: PopularEpisode[];
  referrers: Record<string, number>;
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch('/api/admin/analytics');
        if (res.ok) {
          const analyticsData = await res.json();
          setData(analyticsData);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="py-16 text-center text-text-muted text-caption flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
        <span>Aggregating analytics data...</span>
      </div>
    );
  }

  const views = data?.summary.totalViews || 0;
  const reads = data?.summary.totalReads || 0;
  const conversionRate = views > 0 ? ((reads / views) * 100).toFixed(1) : '0.0';

  // Calculate total referrer count for percentage breakdown
  const referrerEntries = Object.entries(data?.referrers || {});
  const totalReferrals = referrerEntries.reduce((sum, [_, count]) => sum + count, 0);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-h2 font-bebas text-brand-primary tracking-wider uppercase">
          Publisher Analytics
        </h2>
        <p className="text-body-default text-text-secondary mt-1">
          Monitor your traffic referral domains, landing rates, and popular chapters
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-xl border border-border-custom bg-surface flex flex-col gap-2">
          <span className="text-[10px] uppercase font-bold text-text-muted">Total Discovery Views</span>
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-status-info" />
            <span className="text-h2 font-bebas text-text-primary tracking-wide">{views}</span>
          </div>
          <p className="text-[10px] text-text-muted mt-1">Total page-hits across home & story pages</p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-xl border border-border-custom bg-surface flex flex-col gap-2">
          <span className="text-[10px] uppercase font-bold text-text-muted">Episode Completions</span>
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-brand-primary" />
            <span className="text-h2 font-bebas text-text-primary tracking-wide">{reads}</span>
          </div>
          <p className="text-[10px] text-text-muted mt-1">Number of times users read a full chapter</p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-xl border border-border-custom bg-surface flex flex-col gap-2">
          <span className="text-[10px] uppercase font-bold text-text-muted">Completion Rate</span>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-brand-primary" />
            <span className="text-h2 font-bebas text-text-primary tracking-wide">{conversionRate}%</span>
          </div>
          <p className="text-[10px] text-text-muted mt-1">Ratio of landing page views to episode reads</p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referrers breakdown */}
        <div className="p-6 rounded-xl border border-border-custom bg-surface flex flex-col gap-4">
          <div className="border-b border-border-custom pb-3 flex items-center gap-2">
            <Globe className="w-5 h-5 text-brand-primary" />
            <h3 className="text-h3 font-bebas text-brand-primary uppercase tracking-wider">
              Traffic Sources
            </h3>
          </div>

          <div className="flex flex-col gap-4">
            {referrerEntries.length === 0 ? (
              <div className="text-center py-8 text-text-muted text-caption">No traffic data recorded.</div>
            ) : (
              referrerEntries
                .sort((a, b) => b[1] - a[1])
                .map(([domain, count]) => {
                  const pct = totalReferrals > 0 ? ((count / totalReferrals) * 100).toFixed(1) : '0';
                  return (
                    <div key={domain} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-caption font-semibold">
                        <span className="text-text-primary max-w-[70%] truncate font-mono">{domain}</span>
                        <span className="text-text-secondary">{count} clicks ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-background border border-border-custom rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-primary rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Popular Chapter Leaderboard */}
        <div className="p-6 rounded-xl border border-border-custom bg-surface flex flex-col gap-4">
          <div className="border-b border-border-custom pb-3 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-brand-primary" />
            <h3 className="text-h3 font-bebas text-brand-primary uppercase tracking-wider">
              Chapter Rankings
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {data?.popularEpisodes.length === 0 ? (
              <div className="text-center py-8 text-text-muted text-caption">No readership records.</div>
            ) : (
              data?.popularEpisodes.map((ep, idx) => (
                <div
                  key={ep.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background border border-border-custom/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-small flex items-center justify-center font-bold font-mono">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-caption font-bold text-text-primary block">
                        {ep.stories?.title}
                      </span>
                      <span className="text-[10px] text-text-muted block mt-0.5">
                        Episode {ep.episode_number} {ep.title ? `— "${ep.title}"` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-caption font-semibold font-mono text-text-secondary">
                    <span>{ep.view_count} views</span>
                    <span className="text-text-muted">|</span>
                    <span>{ep.like_count} likes</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
