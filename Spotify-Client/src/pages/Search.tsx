import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, Play, AlertCircle, X, Clock, Trash2 } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { searchApi, browseApi, playerApi, isBackendConfigured } from '@/services/api';
import { Input } from '@/components/ui/input';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { SkeletonCard, SkeletonArtistCard, SkeletonCategoryCard, SkeletonTrackRow } from '@/components/ui/skeleton-cards';
import type { SpotifyTrack, SpotifyArtist, SpotifyAlbum, SpotifyPlaylist, Category } from '@/types/spotify';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function CategoryCard({ category, index }: { category: Category; index: number }) {
  const gradients = [
    'from-pink-500 to-rose-500',
    'from-violet-500 to-purple-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-yellow-500 to-orange-500',
    'from-red-500 to-pink-500',
    'from-indigo-500 to-blue-500',
    'from-teal-500 to-green-500',
  ];
  const gradient = gradients[Math.abs(category.id.charCodeAt(0)) % gradients.length];

  return (
    <AnimatedContainer delay={index * 30} animation="scale-in">
      <Link
        to={`/genre/${category.id}`}
        className={cn(
          "relative aspect-square rounded-lg overflow-hidden block transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-100",
          `bg-gradient-to-br ${gradient}`
        )}
      >
        <h3 className="absolute top-4 left-4 text-xl font-bold text-white drop-shadow-lg">{category.name}</h3>
        {category.icons[0]?.url && (
          <img
            src={category.icons[0].url}
            alt={category.name}
            className="absolute bottom-0 right-0 w-24 h-24 object-cover rotate-25 translate-x-4 translate-y-4 shadow-lg transition-transform duration-300 group-hover:rotate-12"
          />
        )}
      </Link>
    </AnimatedContainer>
  );
}

function TrackResult({ track, index, onSelect }: { track: SpotifyTrack; index: number; onSelect: () => void }) {
  const handlePlay = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onSelect();
    try {
      await playerApi.play({ uris: [track.uri] });
    } catch (error) {
      console.error('Failed to play track:', error);
    }
  };

  return (
    <AnimatedContainer delay={index * 40} animation="fade-in">
      <div
        onClick={() => handlePlay()}
        className="group flex items-center gap-3 p-2 rounded-md hover:bg-surface-2 cursor-pointer transition-all duration-150 active:scale-[0.99]"
      >
        <div className="relative overflow-hidden rounded">
          <Link to={`/album/${track.album.id}`} onClick={(e) => e.stopPropagation()}>
            <img
              src={track.album.images[0]?.url || '/placeholder.svg'}
              alt={track.album.name}
              className="w-10 h-10 object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </Link>
          <button
            onClick={(e) => handlePlay(e)}
            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <Play className="h-4 w-4 text-white fill-current" />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("font-medium text-sm truncate transition-colors group-hover:text-primary", track.explicit && "flex items-center gap-2")}>
            {track.name}
            {track.explicit && (
              <span className="text-[10px] bg-muted-foreground/30 px-1 rounded uppercase">E</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {track.artists.map((a, i) => (
              <span key={a.id}>
                <Link to={`/artist/${a.id}`} onClick={(e) => e.stopPropagation()} className="hover:underline hover:text-foreground">{a.name}</Link>
                {i < track.artists.length - 1 && ', '}
              </span>
            ))}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{formatDuration(track.duration_ms)}</span>
      </div>
    </AnimatedContainer>
  );
}

function ArtistResult({ artist, index, onSelect }: { artist: SpotifyArtist; index: number; onSelect: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  const handlePlayArtist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await playerApi.play({ context_uri: artist.uri });
    } catch (error) {
      console.error('Failed to play artist:', error);
    }
  };

  return (
    <AnimatedContainer delay={index * 50} animation="scale-in">
      <Link
        to={`/artist/${artist.id}`}
        onClick={onSelect}
        className="group p-4 rounded-lg bg-surface-2/50 hover:bg-surface-2 transition-all duration-300 block transform hover:-translate-y-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative mb-4 overflow-hidden rounded-full shadow-lg">
          <img
            src={artist.images[0]?.url || '/placeholder.svg'}
            alt={artist.name}
            className={cn(
              "w-full aspect-square object-cover transition-transform duration-500",
              isHovered && "scale-105"
            )}
          />
          <button onClick={handlePlayArtist} className={cn(
            "absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-xl transition-all duration-300",
            "hover:scale-110 active:scale-95",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}>
            <Play className="h-4 w-4 text-primary-foreground fill-current ml-0.5" />
          </button>
        </div>
        <h3 className="font-bold text-sm truncate">{artist.name}</h3>
        <p className="text-xs text-muted-foreground">Artist</p>
      </Link>
    </AnimatedContainer>
  );
}

function AlbumResult({ album, index, onSelect }: { album: SpotifyAlbum; index: number; onSelect: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <AnimatedContainer delay={index * 50} animation="scale-in">
      <Link
        to={`/album/${album.id}`}
        onClick={onSelect}
        className="group p-4 rounded-lg bg-surface-2/50 hover:bg-surface-2 transition-all duration-300 block transform hover:-translate-y-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative mb-4 overflow-hidden rounded-md shadow-lg">
          <img
            src={album.images[0]?.url || '/placeholder.svg'}
            alt={album.name}
            className={cn(
              "w-full aspect-square object-cover transition-transform duration-500",
              isHovered && "scale-105"
            )}
          />
          <button onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
              await playerApi.play({ context_uri: album.uri });
            } catch (error) {
              console.error('Failed to play album:', error);
            }
          }} className={cn(
            "absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-xl transition-all duration-300",
            "hover:scale-110 active:scale-95",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}>
            <Play className="h-4 w-4 text-primary-foreground fill-current ml-0.5" />
          </button>
        </div>
        <h3 className="font-bold text-sm truncate">{album.name}</h3>
        <p className="text-xs text-muted-foreground truncate">
          {album.release_date?.split('-')[0] ?? ''} • {album.artists?.map(a => a.name).join(', ')}
        </p>
      </Link>
    </AnimatedContainer>
  );
}

function PlaylistResult({ playlist, index, onSelect }: { playlist: SpotifyPlaylist; index: number; onSelect: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <AnimatedContainer delay={index * 50} animation="scale-in">
      <Link
        to={`/playlist/${playlist.id}`}
        onClick={onSelect}
        className="group p-4 rounded-lg bg-surface-2/50 hover:bg-surface-2 transition-all duration-300 block transform hover:-translate-y-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative mb-4 overflow-hidden rounded-md shadow-lg">
          <img
            src={playlist.images[0]?.url || '/placeholder.svg'}
            alt={playlist.name}
            className={cn(
              "w-full aspect-square object-cover transition-transform duration-500",
              isHovered && "scale-105"
            )}
          />
          <button onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
              await playerApi.play({ context_uri: playlist.uri });
            } catch (error) {
              console.error('Failed to play playlist:', error);
            }
          }} className={cn(
            "absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-xl transition-all duration-300",
            "hover:scale-110 active:scale-95",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}>
            <Play className="h-4 w-4 text-primary-foreground fill-current ml-0.5" />
          </button>
        </div>
        <h3 className="font-bold text-sm truncate">{playlist.name}</h3>
        <p className="text-xs text-muted-foreground truncate">By {playlist.owner.display_name}</p>
      </Link>
    </AnimatedContainer>
  );
}

function WaitingForBackend() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-6 animate-bounce-subtle">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Waiting for Backend</h2>
      <p className="text-muted-foreground max-w-md">
        Configure your backend URL to enable search. Set the <code className="bg-surface-2 px-2 py-1 rounded text-sm">VITE_API_BASE_URL</code> environment variable.
      </p>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top result skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
        <div>
          <div className="h-8 w-32 bg-surface-3 rounded mb-4 animate-pulse" />
          <div className="bg-surface-1 rounded-lg p-5">
            <div className="w-24 h-24 bg-surface-3 rounded mb-4 animate-pulse" />
            <div className="h-8 w-48 bg-surface-3 rounded mb-2 animate-pulse" />
            <div className="h-4 w-32 bg-surface-3 rounded animate-pulse" />
          </div>
        </div>
        <div>
          <div className="h-8 w-24 bg-surface-3 rounded mb-4 animate-pulse" />
          <div className="space-y-1">
            {[...Array(4)].map((_, i) => (
              <SkeletonTrackRow key={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Artists skeleton */}
      <div>
        <div className="h-8 w-24 bg-surface-3 rounded mb-4 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <SkeletonArtistCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-fade-in">
      {[...Array(10)].map((_, i) => (
        <SkeletonCategoryCard key={i} />
      ))}
    </div>
  );
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const backendConfigured = isBackendConfigured();

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categoriesWithContent'],
    queryFn: browseApi.getCategoriesWithContent,
    enabled: backendConfigured,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes since this is a heavy call
  });

  // Recent Searches Logic
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent searches');
      }
    }
  }, []);

  const addToInfoHistory = (term: string) => {
    if (!term.trim()) return;
    const cleanTerm = term.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(t => t.toLowerCase() !== cleanTerm.toLowerCase());
      const updated = [cleanTerm, ...filtered].slice(0, 10);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromHistory = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(t => t !== term);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const handleResultSelect = () => {
    addToInfoHistory(debouncedQuery);
  };


  const { data: searchResults, isLoading: searchLoading, error: searchError } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchApi.search(debouncedQuery),
    enabled: backendConfigured && debouncedQuery.length > 0,
  });

  const isSearching = debouncedQuery.length > 0;
  const hasResults = searchResults && (
    searchResults.tracks.items.length > 0 ||
    searchResults.artists.items.length > 0 ||
    searchResults.albums.items.length > 0 ||
    searchResults.playlists.items.length > 0
  );

  if (!backendConfigured) {
    return (

      <WaitingForBackend />

    );
  }

  return (

    <div className="p-6">
      {/* Search Input */}
      <AnimatedContainer animation="slide-up">
        <div className={cn(
          "relative max-w-md mb-8 transition-all duration-300",
          isFocused && "max-w-lg"
        )}>
          <SearchIcon className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-200",
            isFocused ? "text-foreground" : "text-muted-foreground"
          )} />
          <Input
            type="text"
            placeholder="What do you want to listen to?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "pl-10 pr-10 h-12 text-base bg-surface-1 border-0 rounded-full transition-all duration-300",
              "focus-visible:ring-2 focus-visible:ring-foreground focus-visible:bg-surface-2"
            )}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-3 rounded-full transition-all duration-200 hover:scale-110"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </AnimatedContainer>

      {/* Search Results */}
      {isSearching ? (
        <>
          {searchLoading ? (
            <SearchSkeleton />
          ) : searchError ? (
            <AnimatedContainer animation="fade-in">
              <div className="text-center py-20">
                <p className="text-muted-foreground">Error searching. Please try again.</p>
              </div>
            </AnimatedContainer>
          ) : hasResults ? (
            <div className="space-y-8">
              {/* Top Result & Songs */}
              <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
                {/* Top Result */}
                {searchResults.tracks.items[0] && (
                  <section>
                    <AnimatedContainer animation="fade-in">
                      <h2 className="text-2xl font-bold mb-4">Top result</h2>
                    </AnimatedContainer>
                    <AnimatedContainer delay={100} animation="scale-in">
                      <div
                        onClick={async () => {
                          handleResultSelect();
                          try {
                            await playerApi.play({ uris: [searchResults.tracks.items[0].uri] });
                          } catch (error) {
                            console.error('Failed to play track:', error);
                          }
                        }}
                        className="group bg-surface-1 hover:bg-surface-2 rounded-lg p-5 cursor-pointer transition-all duration-300 relative overflow-hidden"
                      >
                        <img
                          src={searchResults.tracks.items[0].album.images[0]?.url || '/placeholder.svg'}
                          alt={searchResults.tracks.items[0].name}
                          className="w-24 h-24 rounded shadow-lg mb-4 transition-transform duration-300 group-hover:scale-105"
                        />
                        <h3 className="text-3xl font-bold mb-2 transition-colors group-hover:text-primary">{searchResults.tracks.items[0].name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {searchResults.tracks.items[0].artists.map(a => a.name).join(', ')} • Song
                        </p>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await playerApi.play({ uris: [searchResults.tracks.items[0].uri] });
                            } catch (error) {
                              console.error('Failed to play track:', error);
                            }
                          }}
                          className="absolute bottom-5 right-5 w-12 h-12 rounded-full bg-primary flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl hover:scale-110 active:scale-95"
                        >
                          <Play className="h-5 w-5 text-primary-foreground fill-current ml-0.5" />
                        </button>
                      </div>
                    </AnimatedContainer>
                  </section>
                )}

                {/* Songs */}
                {searchResults.tracks.items.length > 0 && (
                  <section>
                    <AnimatedContainer animation="fade-in">
                      <h2 className="text-2xl font-bold mb-4">Songs</h2>
                    </AnimatedContainer>
                    <div className="space-y-1">
                      {searchResults.tracks.items.slice(0, 4).map((track, index) => (
                        <TrackResult key={track.id} track={track} index={index} onSelect={handleResultSelect} />
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Artists */}
              {searchResults.artists.items.length > 0 && (
                <section>
                  <AnimatedContainer delay={200} animation="fade-in">
                    <h2 className="text-2xl font-bold mb-4">Artists</h2>
                  </AnimatedContainer>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {searchResults.artists.items.slice(0, 6).map((artist, index) => (
                      <ArtistResult key={artist.id} artist={artist} index={index} onSelect={handleResultSelect} />
                    ))}
                  </div>
                </section>
              )}

              {/* Albums */}
              {searchResults.albums.items.length > 0 && (
                <section>
                  <AnimatedContainer delay={300} animation="fade-in">
                    <h2 className="text-2xl font-bold mb-4">Albums</h2>
                  </AnimatedContainer>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {searchResults.albums.items.slice(0, 6).map((album, index) => (
                      <AlbumResult key={album.id} album={album} index={index} onSelect={handleResultSelect} />
                    ))}
                  </div>
                </section>
              )}

              {/* Playlists */}
              {searchResults.playlists.items.length > 0 && (
                <section>
                  <AnimatedContainer delay={400} animation="fade-in">
                    <h2 className="text-2xl font-bold mb-4">Playlists</h2>
                  </AnimatedContainer>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {searchResults.playlists.items.slice(0, 6).map((playlist, index) => (
                      <PlaylistResult key={playlist.id} playlist={playlist} index={index} onSelect={handleResultSelect} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <AnimatedContainer animation="fade-in">
              <div className="text-center py-20">
                <p className="text-muted-foreground">No results found for "{debouncedQuery}"</p>
              </div>
            </AnimatedContainer>
          )}
        </>
      ) : (
        /* Browse Categories */
        <section>
          <AnimatedContainer animation="fade-in">
            <h2 className="text-2xl font-bold mb-4">Browse all</h2>
          </AnimatedContainer>

          {/* Recent Searches Section */}
          {!query && recentSearches.length > 0 && (
            <div className="mb-10 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Recent Searches</h3>
                <button
                  onClick={clearHistory}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {recentSearches.map((term, i) => (
                  <AnimatedContainer key={term} delay={i * 50} animation="scale-in">
                    <div
                      onClick={() => setQuery(term)}
                      className="group relative flex items-center justify-between p-4 bg-surface-2/50 hover:bg-surface-2 rounded-lg cursor-pointer transition-all duration-200"
                    >
                      <span className="font-medium truncate pr-6">{term}</span>
                      <button
                        onClick={(e) => removeFromHistory(term, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-surface-3 rounded-full transition-all text-muted-foreground hover:text-destructive absolute right-2"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </AnimatedContainer>
                ))}
              </div>
            </div>
          )}

          {categoriesLoading ? (
            <CategoriesSkeleton />
          ) : categories && categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {categories.map((category, index) => (
                <CategoryCard key={category.id} category={category} index={index} />
              ))}
            </div>
          ) : (
            <AnimatedContainer animation="fade-in">
              <div className="text-center py-20">
                <p className="text-muted-foreground">No categories available</p>
              </div>
            </AnimatedContainer>
          )}
        </section>
      )}
    </div>

  );
}
