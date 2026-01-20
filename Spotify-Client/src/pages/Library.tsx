import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Clock, AlertCircle, Grid3X3, List, Search, Heart } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { userApi, isBackendConfigured } from '@/services/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { SkeletonCard, SkeletonArtistCard, SkeletonTrackRow } from '@/components/ui/skeleton-cards';
import type { SpotifyPlaylist, SpotifyAlbum, SpotifyArtist, SpotifyTrack } from '@/types/spotify';

function PlaylistCard({ playlist, index }: { playlist: SpotifyPlaylist; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <AnimatedContainer delay={index * 40} animation="scale-in">
      <Link 
        to={`/playlist/${playlist.id}`}
        className="group relative bg-surface-2/50 hover:bg-surface-2 rounded-md p-4 transition-all duration-300 block transform hover:-translate-y-1"
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
          <button onClick={(e) => e.preventDefault()} className={cn(
            "absolute bottom-2 right-2 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-xl transition-all duration-300",
            "hover:scale-110 active:scale-95",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          )}>
            <Play className="h-5 w-5 text-primary-foreground fill-current ml-0.5" />
          </button>
        </div>
        <h3 className="font-bold text-sm truncate mb-1">{playlist.name}</h3>
        <p className="text-xs text-muted-foreground truncate">
          Playlist • {playlist.tracks.total} songs
        </p>
      </Link>
    </AnimatedContainer>
  );
}

function PlaylistRow({ playlist, index }: { playlist: SpotifyPlaylist; index: number }) {
  return (
    <AnimatedContainer delay={index * 30} animation="fade-in">
      <Link 
        to={`/playlist/${playlist.id}`}
        className="group flex items-center gap-4 p-3 rounded-md hover:bg-surface-2 transition-all duration-200 active:scale-[0.99]"
      >
        <img
          src={playlist.images[0]?.url || '/placeholder.svg'}
          alt={playlist.name}
          className="w-12 h-12 rounded object-cover shadow-sm group-hover:shadow-md transition-shadow"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate group-hover:text-primary transition-colors">{playlist.name}</p>
          <p className="text-sm text-muted-foreground truncate">
            Playlist • {playlist.owner.display_name}
          </p>
        </div>
        <button onClick={(e) => e.preventDefault()} className="opacity-0 group-hover:opacity-100 p-2 transition-all duration-200 hover:scale-110">
          <Play className="h-5 w-5 fill-current" />
        </button>
      </Link>
    </AnimatedContainer>
  );
}

function AlbumCard({ album, index }: { album: SpotifyAlbum; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <AnimatedContainer delay={index * 40} animation="scale-in">
      <Link 
        to={`/album/${album.id}`}
        className="group relative bg-surface-2/50 hover:bg-surface-2 rounded-md p-4 transition-all duration-300 block transform hover:-translate-y-1"
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
          <button onClick={(e) => e.preventDefault()} className={cn(
            "absolute bottom-2 right-2 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-xl transition-all duration-300",
            "hover:scale-110 active:scale-95",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          )}>
            <Play className="h-5 w-5 text-primary-foreground fill-current ml-0.5" />
          </button>
        </div>
        <h3 className="font-bold text-sm truncate mb-1">{album.name}</h3>
        <p className="text-xs text-muted-foreground truncate">
          {album.artists.map((a, i) => (
            <span key={a.id}>
              <Link 
                to={`/artist/${a.id}`} 
                className="hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {a.name}
              </Link>
              {i < album.artists.length - 1 && ', '}
            </span>
          ))}
        </p>
      </Link>
    </AnimatedContainer>
  );
}

function ArtistCard({ artist, index }: { artist: SpotifyArtist; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <AnimatedContainer delay={index * 40} animation="scale-in">
      <Link 
        to={`/artist/${artist.id}`}
        className="group relative bg-surface-2/50 hover:bg-surface-2 rounded-md p-4 transition-all duration-300 block transform hover:-translate-y-1"
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
          <button onClick={(e) => e.preventDefault()} className={cn(
            "absolute bottom-2 right-2 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-xl transition-all duration-300",
            "hover:scale-110 active:scale-95",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          )}>
            <Play className="h-5 w-5 text-primary-foreground fill-current ml-0.5" />
          </button>
        </div>
        <h3 className="font-bold text-sm truncate mb-1">{artist.name}</h3>
        <p className="text-xs text-muted-foreground">Artist</p>
      </Link>
    </AnimatedContainer>
  );
}

function TrackRow({ track, index }: { track: SpotifyTrack; index: number }) {
  const [isLiked, setIsLiked] = useState(false);
  
  return (
    <AnimatedContainer delay={index * 30} animation="fade-in">
      <div className="group grid grid-cols-[16px_4fr_2fr_minmax(80px,1fr)] gap-4 px-4 py-2 rounded-md hover:bg-surface-2/50 items-center text-sm transition-colors duration-150">
        <span className="text-muted-foreground group-hover:hidden text-right tabular-nums">{index + 1}</span>
        <button className="hidden group-hover:flex items-center justify-center text-foreground hover:text-primary transition-colors">
          <Play className="h-4 w-4 fill-current" />
        </button>
        <div className="flex items-center gap-3 min-w-0">
          <Link to={`/album/${track.album.id}`}>
            <img
              src={track.album.images[0]?.url || '/placeholder.svg'}
              alt={track.album.name}
              className="w-10 h-10 rounded object-cover shadow-sm group-hover:shadow-md transition-shadow"
            />
          </Link>
          <div className="min-w-0">
            <p className="font-medium truncate group-hover:text-primary transition-colors">{track.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {track.artists.map((a, i) => (
                <span key={a.id}>
                  <Link to={`/artist/${a.id}`} className="hover:underline hover:text-foreground">{a.name}</Link>
                  {i < track.artists.length - 1 && ', '}
                </span>
              ))}
            </p>
          </div>
        </div>
        <Link to={`/album/${track.album.id}`} className="text-muted-foreground truncate hover:underline hover:text-foreground">{track.album.name}</Link>
        <div className="flex items-center justify-end gap-3">
          <button 
            onClick={() => setIsLiked(!isLiked)}
            className={cn("opacity-0 group-hover:opacity-100 transition-all duration-200", isLiked && "opacity-100")}
          >
            <Heart className={cn("h-4 w-4 transition-all", isLiked ? "text-primary fill-primary animate-heart-beat" : "text-muted-foreground hover:text-foreground")} />
          </button>
          <span className="text-muted-foreground tabular-nums">{formatDuration(track.duration_ms)}</span>
        </div>
      </div>
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
        Configure your backend URL to view your library. Set the <code className="bg-surface-2 px-2 py-1 rounded text-sm">VITE_API_BASE_URL</code> environment variable.
      </p>
    </div>
  );
}

function EmptyState({ type }: { type: string }) {
  return (
    <AnimatedContainer animation="fade-in">
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Heart className="h-12 w-12 text-muted-foreground mb-4 animate-pulse-subtle" />
        <h3 className="text-xl font-bold mb-2">No {type} yet</h3>
        <p className="text-muted-foreground">Save {type} to build your library</p>
      </div>
    </AnimatedContainer>
  );
}

function LibrarySkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-fade-in">
      {[...Array(12)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default function Library() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchFilter, setSearchFilter] = useState('');
  const backendConfigured = isBackendConfigured();

  const { data: playlists, isLoading: playlistsLoading } = useQuery({
    queryKey: ['userPlaylists'],
    queryFn: userApi.getPlaylists,
    enabled: backendConfigured,
  });

  const { data: albums, isLoading: albumsLoading } = useQuery({
    queryKey: ['savedAlbums'],
    queryFn: userApi.getSavedAlbums,
    enabled: backendConfigured,
  });

  const { data: artists, isLoading: artistsLoading } = useQuery({
    queryKey: ['topArtists'],
    queryFn: () => userApi.getTopArtists(50),
    enabled: backendConfigured,
  });

  const { data: savedTracks, isLoading: tracksLoading } = useQuery({
    queryKey: ['savedTracks'],
    queryFn: userApi.getSavedTracks,
    enabled: backendConfigured,
  });

  if (!backendConfigured) {
    return (
      
        <WaitingForBackend />
      
    );
  }

  const filterItems = <T extends { name: string }>(items: T[] | undefined): T[] => {
    if (!items) return [];
    if (!searchFilter) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(searchFilter.toLowerCase())
    );
  };

  return (
    
      <div className="p-6">
        {/* Header */}
        <AnimatedContainer animation="slide-up">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Your Library</h1>
            <div className="flex items-center gap-2">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                <Input
                  type="text"
                  placeholder="Search in library"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9 w-48 bg-surface-1 border-0 h-8 text-sm focus:w-56 transition-all duration-300"
                />
              </div>
              <div className="flex items-center bg-surface-1 rounded-md p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 rounded transition-all duration-200",
                    viewMode === 'list' ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground hover:scale-110"
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 rounded transition-all duration-200",
                    viewMode === 'grid' ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground hover:scale-110"
                  )}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </AnimatedContainer>

        {/* Tabs */}
        <Tabs defaultValue="playlists" className="w-full">
          <AnimatedContainer delay={100} animation="fade-in">
            <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-2 p-0 h-auto mb-6">
              <TabsTrigger 
                value="playlists" 
                className="bg-surface-1 data-[state=active]:bg-foreground data-[state=active]:text-background rounded-full px-4 py-2 text-sm transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Playlists
              </TabsTrigger>
              <TabsTrigger 
                value="albums" 
                className="bg-surface-1 data-[state=active]:bg-foreground data-[state=active]:text-background rounded-full px-4 py-2 text-sm transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Albums
              </TabsTrigger>
              <TabsTrigger 
                value="artists" 
                className="bg-surface-1 data-[state=active]:bg-foreground data-[state=active]:text-background rounded-full px-4 py-2 text-sm transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Artists
              </TabsTrigger>
              <TabsTrigger 
                value="tracks" 
                className="bg-surface-1 data-[state=active]:bg-foreground data-[state=active]:text-background rounded-full px-4 py-2 text-sm transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Liked Songs
              </TabsTrigger>
            </TabsList>
          </AnimatedContainer>

          {/* Playlists Tab */}
          <TabsContent value="playlists" className="animate-fade-in">
            {playlistsLoading ? (
              <LibrarySkeleton />
            ) : filterItems(playlists).length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filterItems(playlists).map((playlist, index) => (
                    <PlaylistCard key={playlist.id} playlist={playlist} index={index} />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {filterItems(playlists).map((playlist, index) => (
                    <PlaylistRow key={playlist.id} playlist={playlist} index={index} />
                  ))}
                </div>
              )
            ) : (
              <EmptyState type="playlists" />
            )}
          </TabsContent>

          {/* Albums Tab */}
          <TabsContent value="albums" className="animate-fade-in">
            {albumsLoading ? (
              <LibrarySkeleton />
            ) : filterItems(albums).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filterItems(albums).map((album, index) => (
                  <AlbumCard key={album.id} album={album} index={index} />
                ))}
              </div>
            ) : (
              <EmptyState type="albums" />
            )}
          </TabsContent>

          {/* Artists Tab */}
          <TabsContent value="artists" className="animate-fade-in">
            {artistsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-fade-in">
                {[...Array(12)].map((_, i) => (
                  <SkeletonArtistCard key={i} />
                ))}
              </div>
            ) : filterItems(artists).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filterItems(artists).map((artist, index) => (
                  <ArtistCard key={artist.id} artist={artist} index={index} />
                ))}
              </div>
            ) : (
              <EmptyState type="artists" />
            )}
          </TabsContent>

          {/* Liked Songs Tab */}
          <TabsContent value="tracks" className="animate-fade-in">
            {tracksLoading ? (
              <div className="bg-surface-1/30 rounded-lg animate-fade-in">
                {[...Array(10)].map((_, i) => (
                  <SkeletonTrackRow key={i} />
                ))}
              </div>
            ) : savedTracks && savedTracks.length > 0 ? (
              <div className="bg-surface-1/30 rounded-lg overflow-hidden">
                {/* Header */}
                <AnimatedContainer animation="fade-in">
                  <div className="flex items-center gap-4 p-6 bg-gradient-to-b from-indigo-800/50 to-transparent rounded-t-lg">
                    <div className="w-52 h-52 rounded flex items-center justify-center bg-gradient-to-br from-indigo-700 to-zinc-400 shadow-2xl transition-transform hover:scale-105">
                      <Heart className="h-20 w-20 text-white fill-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Playlist</p>
                      <h2 className="text-5xl font-bold mt-2 mb-6">Liked Songs</h2>
                      <p className="text-sm text-muted-foreground">{savedTracks.length} songs</p>
                    </div>
                  </div>
                </AnimatedContainer>
                {/* Table Header */}
                <div className="grid grid-cols-[16px_4fr_2fr_minmax(80px,1fr)] gap-4 px-4 py-2 border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                  <span>#</span>
                  <span>Title</span>
                  <span>Album</span>
                  <span className="text-right"><Clock className="h-4 w-4 inline" /></span>
                </div>
                {/* Tracks */}
                {savedTracks.map((track, index) => (
                  <TrackRow key={track.id} track={track} index={index} />
                ))}
              </div>
            ) : (
              <EmptyState type="liked songs" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    
  );
}
