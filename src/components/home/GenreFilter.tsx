'use client';

interface GenreFilterProps {
  genres: string[];
  selectedGenre: string | null;
  onSelectGenre: (genre: string | null) => void;
}

export function GenreFilter({ genres, selectedGenre, onSelectGenre }: GenreFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 py-4">
      <button
        onClick={() => onSelectGenre(null)}
        className={`px-4 py-2 rounded-lg text-small font-semibold border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 ${
          selectedGenre === null
            ? 'bg-brand-primary border-brand-primary text-background'
            : 'bg-surface border-border-custom text-text-secondary hover:text-text-primary hover:border-text-secondary/30'
        }`}
      >
        All Genres
      </button>
      {genres.map((genre) => (
        <button
          key={genre}
          onClick={() => onSelectGenre(genre)}
          className={`px-4 py-2 rounded-lg text-small font-semibold border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 ${
            selectedGenre === genre
              ? 'bg-brand-primary border-brand-primary text-background'
              : 'bg-surface border-border-custom text-text-secondary hover:text-text-primary hover:border-text-secondary/30'
          }`}
        >
          {genre}
        </button>
      ))}
    </div>
  );
}
