import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Library, Plus, Heart, Music2, X, Sparkles, Compass, ArrowUpRight, ListFilter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi, playlistApi, isBackendConfigured } from '@/services/api';
import { SkeletonSidebar } from '@/components/ui/skeleton-cards';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { SpotifyArtist, SpotifyPlaylist } from '@/types/spotify';

interface SidebarProps {
  className?: string;
}

// Filter types for library - simplified to match Spotify
type LibraryFilter = 'all' | 'playlists' | 'artists';

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>('all');
  const [librarySearch, setLibrarySearch] = useState('');
  const [showLibrarySearch, setShowLibrarySearch] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Compass, label: 'Browse', path: '/browse' },
    { icon: Sparkles, label: 'Made For You', path: '/recommendations' },
  ];

  const backendConfigured = isBackendConfigured();

  // Fetch user playlists
  const { data: playlists, isLoading: playlistsLoading } = useQuery({
    queryKey: ['userPlaylists'],
    queryFn: userApi.getPlaylists,
    enabled: backendConfigured,
  });

  // Fetch followed artists
  const { data: followedArtists, isLoading: artistsLoading } = useQuery({
    queryKey: ['followedArtists'],
    queryFn: () => userApi.getFollowedArtists(50),
    enabled: backendConfigured,
  });

  const { data: user } = useQuery({
    queryKey: ['userProfile'],
    queryFn: userApi.getProfile,
    enabled: backendConfigured,
  });

  // Filter items based on search and filter
  const getFilteredItems = () => {
    const items: Array<{ type: 'playlist' | 'artist' | 'liked'; data?: SpotifyPlaylist | SpotifyArtist; name: string }> = [];

    // Always include Liked Songs at top
    if (libraryFilter === 'all' || libraryFilter === 'playlists') {
      items.push({ type: 'liked', name: 'Liked Songs' });
    }

    // Add playlists
    if (libraryFilter === 'all' || libraryFilter === 'playlists') {
      playlists?.forEach(p => {
        if (!librarySearch || p.name.toLowerCase().includes(librarySearch.toLowerCase())) {
          items.push({ type: 'playlist', data: p, name: p.name });
        }
      });
    }

    // Add artists
    if (libraryFilter === 'all' || libraryFilter === 'artists') {
      followedArtists?.forEach(a => {
        if (!librarySearch || a.name.toLowerCase().includes(librarySearch.toLowerCase())) {
          items.push({ type: 'artist', data: a, name: a.name });
        }
      });
    }

    return items;
  };

  const filteredItems = getFilteredItems();

  const handleCreatePlaylist = async () => {
    if (!backendConfigured || !user || !newPlaylistName.trim()) return;

    setIsCreating(true);
    try {
      await playlistApi.createPlaylist(user.id, newPlaylistName.trim(), undefined, false);
      queryClient.invalidateQueries({ queryKey: ['userPlaylists'] });
      setShowCreatePlaylistModal(false);
      setNewPlaylistName('');
    } catch (error) {
      console.error('Failed to create playlist:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const filterChips: { value: LibraryFilter; label: string }[] = [
    { value: 'playlists', label: 'Playlists' },
    { value: 'artists', label: 'Artists' },
  ];

  const isLoading = playlistsLoading || artistsLoading;

  return (
    <>
      <aside className={cn(
        "w-sidebar bg-background flex flex-col gap-2 p-2 h-full",
        className
      )}>
        {/* Main Navigation */}
        <nav className="bg-surface-1 rounded-lg p-4 animate-fade-in">
          <ul className="space-y-2">
            {navItems.map(({ icon: Icon, label, path }, index) => (
              <li key={path}>
                <AnimatedContainer delay={index * 50} animation="fade-in">
                  <Link
                    to={path}
                    className={cn(
                      "flex items-center gap-5 px-3 py-3 rounded-md text-sm font-bold transition-all duration-200 group",
                      location.pathname === path
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className={cn(
                      "h-6 w-6 transition-transform duration-200",
                      "group-hover:scale-110"
                    )} />
                    {label}
                  </Link>
                </AnimatedContainer>
              </li>
            ))}
          </ul>
        </nav>

        {/* Library Section - Spotify Style */}
        <div className="bg-surface-1 rounded-lg flex-1 flex flex-col min-h-0 animate-fade-in overflow-hidden">
          {/* Library Header */}
          <div className="p-4 flex items-center justify-between flex-shrink-0">
            <Link
              to="/library"
              className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <Library className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-bold">Your Library</span>
            </Link>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowCreatePlaylistModal(true)}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-all duration-200 hover:scale-105"
                title="Create playlist"
              >
                <Plus className="h-5 w-5" />
              </button>
              <button
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-all duration-200 hover:scale-105"
                title="Expand library"
              >
                <ArrowUpRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Filter Chips - Spotify Style (only 2: Playlists, Artists) */}
          <div className="px-4 pb-2 flex gap-2 flex-shrink-0">
            {libraryFilter !== 'all' && (
              <button
                onClick={() => setLibraryFilter('all')}
                className="p-1.5 rounded-full bg-surface-2 hover:bg-surface-3 transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {filterChips.map(chip => (
              <button
                key={chip.value}
                onClick={() => setLibraryFilter(libraryFilter === chip.value ? 'all' : chip.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200",
                  libraryFilter === chip.value
                    ? "bg-foreground text-background"
                    : "bg-surface-2 text-foreground hover:bg-surface-3"
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Search + Recents Row */}
          <div className="px-4 pb-2 flex items-center justify-between flex-shrink-0">
            <button
              onClick={() => setShowLibrarySearch(!showLibrarySearch)}
              className={cn(
                "p-2 rounded-full transition-all duration-200 hover:scale-105",
                showLibrarySearch
                  ? "text-foreground bg-surface-3"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-3"
              )}
            >
              <Search className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Recents
              <ListFilter className="h-4 w-4" />
            </button>
          </div>

          {/* Library Search Input */}
          {showLibrarySearch && (
            <div className="px-4 pb-2 flex-shrink-0">
              <AnimatedContainer animation="scale-in">
                <Input
                  type="text"
                  placeholder="Search in Your Library"
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  className="bg-surface-2 border-0 h-8 text-sm"
                  autoFocus
                />
              </AnimatedContainer>
            </div>
          )}

          {/* Loading State */}
          {isLoading && backendConfigured && (
            <SkeletonSidebar />
          )}

          {/* Library Items List */}
          <div className="flex-1 overflow-y-auto px-2 scrollbar-thin">
            {filteredItems.map((item, index) => {
              if (item.type === 'liked') {
                return (
                  <AnimatedContainer key="liked-songs" delay={index * 20} animation="fade-in">
                    <Link
                      to="/collection/tracks"
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-md hover:bg-surface-2 transition-all duration-200 group active:scale-[0.98]",
                        location.pathname === '/collection/tracks' && "bg-surface-2"
                      )}
                    >
                      <div className="w-12 h-12 rounded flex items-center justify-center bg-gradient-to-br from-indigo-800 to-zinc-400 shadow-md group-hover:shadow-lg transition-shadow flex-shrink-0">
                        <Heart className="h-5 w-5 text-white fill-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">Liked Songs</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="w-1 h-1 bg-primary rounded-full" />
                          Playlist
                        </p>
                      </div>
                    </Link>
                  </AnimatedContainer>
                );
              }

              if (item.type === 'artist') {
                const artist = item.data as SpotifyArtist;
                return (
                  <AnimatedContainer key={`artist-${artist.id}`} delay={index * 20} animation="fade-in">
                    <Link
                      to={`/artist/${artist.id}`}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-md hover:bg-surface-2 transition-all duration-200 group active:scale-[0.98]",
                        location.pathname === `/artist/${artist.id}` && "bg-surface-2"
                      )}
                    >
                      {/* Circular avatar for artists */}
                      <img
                        src={artist.images?.[0]?.url || '/placeholder.svg'}
                        alt={artist.name}
                        className="w-12 h-12 rounded-full object-cover shadow-sm group-hover:shadow-md transition-shadow flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                          {artist.name}
                        </p>
                        <p className="text-xs text-muted-foreground">Artist</p>
                      </div>
                    </Link>
                  </AnimatedContainer>
                );
              }

              if (item.type === 'playlist') {
                const playlist = item.data as SpotifyPlaylist;
                return (
                  <AnimatedContainer key={`playlist-${playlist.id}`} delay={index * 20} animation="fade-in">
                    <Link
                      to={`/playlist/${playlist.id}`}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-md hover:bg-surface-2 transition-all duration-200 group active:scale-[0.98]",
                        location.pathname === `/playlist/${playlist.id}` && "bg-surface-2"
                      )}
                    >
                      <img
                        src={playlist.images?.[0]?.url || '/placeholder.svg'}
                        alt={playlist.name}
                        className="w-12 h-12 rounded object-cover shadow-sm group-hover:shadow-md transition-shadow flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                          {playlist.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          {playlist.owner?.id === user?.id && (
                            <span className="w-1 h-1 bg-primary rounded-full flex-shrink-0" />
                          )}
                          Playlist • {playlist.owner?.display_name}
                        </p>
                      </div>
                    </Link>
                  </AnimatedContainer>
                );
              }

              return null;
            })}

            {/* Empty state when filtered */}
            {filteredItems.length === 0 && librarySearch && (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No results found for "{librarySearch}"</p>
              </div>
            )}

            {/* Empty state when no items */}
            {!isLoading && filteredItems.length === 0 && !librarySearch && (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {libraryFilter === 'artists'
                    ? 'Follow some artists to see them here'
                    : 'Create a playlist to get started'}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Create Playlist Modal */}
      <Dialog open={showCreatePlaylistModal} onOpenChange={setShowCreatePlaylistModal}>
        <DialogContent className="bg-surface-2 border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Create playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              type="text"
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="bg-surface-3 border-0"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreatePlaylistModal(false)}
                className="px-4 py-2 font-bold text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim() || isCreating}
                className={cn(
                  "px-6 py-2 rounded-full font-bold text-sm transition-all",
                  "bg-primary text-primary-foreground hover:scale-105",
                  (!newPlaylistName.trim() || isCreating) && "opacity-50 cursor-not-allowed hover:scale-100"
                )}
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}