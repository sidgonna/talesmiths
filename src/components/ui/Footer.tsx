import Link from 'next/link';
import { SubscribeForm } from './SubscribeForm';

export function Footer() {
  return (
    <footer className="w-full bg-surface border-t border-border-custom mt-auto transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between gap-8 md:items-start">
        
        {/* Brand column */}
        <div className="flex flex-col gap-3 max-w-sm">
          <div className="flex items-center gap-2">
            <span className="text-h3 text-brand-primary tracking-wider uppercase font-semibold select-none">
              Tale Smiths
            </span>
          </div>
          <p className="text-caption text-text-secondary leading-relaxed">
            A premium digital canvas for high-fidelity webcomics and AI-generated manga series. Immerse yourself in rich narratives, responsive layouts, and cinematic panels.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <a
              href="https://www.instagram.com/tale5miths/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-background hover:bg-surface-hover border border-border-custom hover:border-brand-primary/40 text-text-secondary hover:text-brand-primary transition-all duration-200"
              aria-label="Instagram Link"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
          </div>
        </div>

        {/* Navigation column */}
        <div className="flex flex-col gap-3">
          <h4 className="text-small font-bold uppercase tracking-wider text-brand-primary">
            Explore
          </h4>
          <nav className="flex flex-col gap-2">
            <Link href="/" className="text-caption text-text-secondary hover:text-text-primary transition-colors">
              Home
            </Link>
            <Link href="/stories" className="text-caption text-text-secondary hover:text-text-primary transition-colors">
              All Stories
            </Link>
            <Link href="/search" className="text-caption text-text-secondary hover:text-text-primary transition-colors">
              Search
            </Link>
          </nav>
        </div>

        {/* Newsletter Subscription column */}
        <SubscribeForm />
      </div>

      {/* Copyright row */}
      <div className="w-full border-t border-border-custom/50 bg-background/25 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span className="text-[10px] text-text-muted">
            &copy; {new Date().getFullYear()} Tale Smiths. All rights reserved.
          </span>
          <span className="text-[10px] text-text-muted">
            Original AI Storytelling & Manga Layouts.
          </span>
        </div>
      </div>
    </footer>
  );
}
