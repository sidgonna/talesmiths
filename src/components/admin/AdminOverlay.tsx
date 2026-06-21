'use client';

import { useState } from 'react';
import { useAdmin } from '@/components/providers/AdminProvider';
import { AdminLogin } from './AdminLogin';
import { Dashboard } from './Dashboard';
import { StoryForm } from './StoryForm';
import { EpisodeForm } from './EpisodeForm';
import { CommentModerator } from './CommentModerator';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { 
  X, 
  LogOut, 
  LayoutDashboard, 
  BookOpen, 
  FolderGit2, 
  MessageSquare, 
  BarChart3, 
  Tv 
} from 'lucide-react';

export function AdminOverlay() {
  const { isAdminOpen, setIsAdminOpen, isAdminLoggedIn, logoutAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAdminOpen) return null;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stories', label: 'Stories', icon: FolderGit2 },
    { id: 'episodes', label: 'Episodes', icon: BookOpen },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex bg-background/98 backdrop-blur-md animate-fade-in select-none text-text-primary">
      {/* 1. Login Gate View */}
      {!isAdminLoggedIn ? (
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <button
            onClick={() => setIsAdminOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-lg bg-surface hover:bg-surface-hover border border-border-custom text-text-secondary hover:text-text-primary transition-all cursor-pointer"
            aria-label="Close creator panel"
          >
            <X className="w-5 h-5" />
          </button>
          <AdminLogin />
        </div>
      ) : (
        // 2. Full Console Navigation Layout
        <div className="flex w-full h-full flex-col md:flex-row overflow-hidden">
          
          {/* Sidebar */}
          <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border-custom bg-surface flex flex-col justify-between shrink-0">
            <div className="flex flex-col h-full">
              {/* Sidebar Header Brand info */}
              <div className="p-6 border-b border-border-custom flex justify-between items-center">
                <div>
                  <h1 className="text-h3 font-bebas text-brand-primary tracking-wider uppercase">
                    Creator Console
                  </h1>
                  <span className="text-[10px] text-text-muted font-mono uppercase tracking-widest font-semibold block mt-0.5">
                    Tale Smiths Admin
                  </span>
                </div>
                {/* Mobile-only close button */}
                <button
                  onClick={() => setIsAdminOpen(false)}
                  className="md:hidden p-1.5 rounded bg-background hover:bg-surface-hover border border-border-custom text-text-secondary cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sidebar Tabs Navigation */}
              <nav className="flex-1 p-4 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-small font-semibold transition-all cursor-pointer whitespace-nowrap md:w-full ${
                        isActive
                          ? 'bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-bold shadow-md shadow-brand-primary/5'
                          : 'border border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover/30'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Sidebar Actions Footer (Logout / Close Desktop) */}
            <div className="p-4 border-t border-border-custom flex md:flex-col gap-2 bg-background/30">
              <button
                onClick={logoutAdmin}
                className="flex-1 md:w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border-custom bg-background hover:bg-status-error/10 hover:border-status-error/30 text-text-secondary hover:text-status-error text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>

              <button
                onClick={() => setIsAdminOpen(false)}
                className="hidden md:flex w-full items-center justify-center gap-2 py-2.5 rounded-lg bg-accent-blood-red hover:bg-accent-hover-crimson text-text-primary text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-accent-blood-red/10"
              >
                <Tv className="w-4 h-4" />
                Return to Reader
              </button>
            </div>
          </aside>

          {/* Main Dashboard Panel workspace */}
          <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-background safe-bottom">
            <div className="mx-auto max-w-5xl">
              {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
              {activeTab === 'stories' && <StoryForm />}
              {activeTab === 'episodes' && <EpisodeForm />}
              {activeTab === 'comments' && <CommentModerator />}
              {activeTab === 'analytics' && <AnalyticsDashboard />}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
