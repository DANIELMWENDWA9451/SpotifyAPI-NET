import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Pause, Heart, MoreHorizontal, AlertCircle, RefreshCw, Sparkles, Clock } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { SkeletonCard, SkeletonTrackRow } from '@/components/ui/skeleton-cards';
import { recommendationsApi, userApi, isBackendConfigured } from '@/services/api';
import type { SpotifyTrack, SpotifyArtist } from '@/types/spotify';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function TrackCard({ track, index, isPlaying, onPlay }: {
  track: SpotifyTrack;
  index: number;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  return (
    <AnimatedContainer delay={index * 40} animation="scale-in">
      <div
        className="group relative bg-surface-2/50 hover:bg-surface-2 rounded-md p-4 transition-all duration-300 transform hover:-translate-y-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative mb-4 overflow-hidden rounded-md shadow-lg">
          <Link to={`/album/${track.album.id}`}>
            <img
              src={track.album.images[0]?.url || '/placeholder.svg'}
              alt={track.album.name}
              className={cn(
                "w-full aspect-square object-cover transition-transform duration-500",
                isHovered && "scale-105"
              )}
            />
          </Link>
          <button
            onClick={onPlay}
            className={cn(
              "absolute bottom-2 right-2 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-xl transition-all duration-300",
              "hover:scale-110 active:scale-95",
              isHovered || isPlaying ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            )}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 text-primary-foreground fill-current" />
            ) : (
              <Play className="h-5 w-5 text-primary-foreground fill-current ml-0.5" />
            )}
          </button>
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={cn(
              "absolute top-2 right-2 p-2 rounded-full bg-black/50 transition-all duration-200",
              isHovered || isLiked ? "opacity-100" : "opacity-0"
            )}
          >
            <Heart className={cn("h-4 w-4", isLiked ? "text-primary fill-primary" : "text-white")} />
          </button>
        </div>
        <h3 className="font-bold text-sm truncate mb-1">{track.name}</h3>
        <p className="text-xs text-muted-foreground truncate">
          {track.artists.map((a, i) => (
            <span key={a.id}>
              <Link to={`/artist/${a.id}`} className="hover:underline hover:text-foreground">{a.name}</Link>
              {i < track.artists.length - 1 && ', '}
            </span>
          ))}
        </p>
      </div>
    </AnimatedContainer>
  );
}

function TrackRow({ track, index, isPlaying, onPlay }: {
  track: SpotifyTrack;
  index: number;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <AnimatedContainer delay={index * 25} animation="fade-in">
      <div
        className={cn(
          "group grid grid-cols-[16px_4fr_2fr_minmax(80px,1fr)] gap-4 px-4 py-2 rounded-md items-center text-sm transition-all duration-150",
          isPlaying ? "bg-surface-2" : "hover:bg-surface-2/50"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={onPlay}
      >
        <div className="flex items-center justify-center">
          {isHovered || isPlaying ? (
            <button onClick={onPlay} className="text-foreground hover:text-primary transition-colors">
              {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
            </button>
          ) : (
            <span className={cn("tabular-nums", isPlaying ? "text-primary" : "text-muted-foreground")}>
              {index + 1}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 min-w-0">
          <Link to={`/album/${track.album.id}`}>
            <img
              src={track.album.images[0]?.url || '/placeholder.svg'}
              alt={track.album.name}
              className="w-10 h-10 rounded object-cover shadow-sm"
            />
          </Link>
          <div className="min-w-0">
            <p className={cn(
              "font-medium truncate transition-colors",
              isPlaying ? "text-primary" : "group-hover:text-primary"
            )}>
              {track.name}
              {track.explicit && (
                <span className="ml-2 text-[10px] bg-muted-foreground/30 px-1 rounded uppercase">E</span>
              )}
            </p>
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

        <Link to={`/album/${track.album.id}`} className="text-muted-foreground truncate hover:underline hover:text-foreground">
          {track.album.name}
        </Link>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={cn("transition-all duration-200", isLiked ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
          >
            <Heart className={cn("h-4 w-4 transition-all", isLiked ? "text-primary fill-primary" : "text-muted-foreground hover:text-foreground")} />
          </button>
          <span className="text-muted-foreground tabular-nums">{formatDuration(track.duration_ms)}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-surface-3 rounded transition-all">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-surface-3 border-border">
              <DropdownMenuItem className="hover:bg-surface-4">Add to queue</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-surface-4">
                <Link to={`/artist/${track.artists[0]?.id}`} className="w-full">Go to artist</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-surface-4">
                <Link to={`/album/${track.album.id}`} className="w-full">Go to album</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:bg-surface-4">Add to playlist</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-surface-4">Share</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </AnimatedContainer>
  );
}

function ArtistSeed({ artist, isSelected, onToggle }: {
  artist: SpotifyArtist;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-3 p-2 rounded-full transition-all duration-200",
        isSelected
          ? "bg-primary text-primary-foreground"
          : "bg-surface-2 hover:bg-surface-3"
      )}
    >
      <img
        src={artist.images[0]?.url || '/placeholder.svg'}
        alt={artist.name}
        className="w-8 h-8 rounded-full object-cover"
      />
      <span className="text-sm font-medium pr-3">{artist.name}</span>
    </button>
  );
}

function WaitingForBackend() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-6 animate-bounce-subtle">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Waiting for Backend</h2>
      <p className="text-muted-foreground max-w-md">Configure your backend URL to get recommendations.</p>
    </div>
  );
}

export default function Recommendations() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [selectedArtistIds, setSelectedArtistIds] = useState<string[]>([]);
  const backendConfigured = isBackendConfigured();

  // Get user's top artists as seeds
  const { data: topArtists, isLoading: artistsLoading } = useQuery({
    queryKey: ['topArtists', 10],
    queryFn: () => userApi.getTopArtists(10),
    enabled: backendConfigured,
    staleTime: 1000 * 60 * 10,
  });

  // Get followed artists as fallback if no top artists
  const { data: followedArtists, isLoading: followedLoading } = useQuery({
    queryKey: ['followedArtists'],
    queryFn: () => userApi.getFollowedArtists(20),
    enabled: backendConfigured && (!topArtists || topArtists.length === 0),
    staleTime: 1000 * 60 * 10,
  });

  // Get user's top tracks for seeding
  const { data: topTracks, isLoading: topTracksLoading } = useQuery({
    queryKey: ['topTracks', 5],
    queryFn: () => userApi.getTopTracks(5),
    enabled: backendConfigured,
    staleTime: 1000 * 60 * 10,
  });

  // Combine artist sources - prioritize top artists, then followed artists
  const availableArtists = (topArtists && topArtists.length > 0)
    ? topArtists
    : (followedArtists ?? []);

  // Build seed parameters - use selected artists or fall back to available
  const seedArtists = selectedArtistIds.length > 0
    ? selectedArtistIds.slice(0, 5)
    : availableArtists.slice(0, 5).map(a => a.id);
  const seedTracks = topTracks?.slice(0, Math.max(0, 5 - seedArtists.length)).map(t => t.id) ?? [];

  // Combine seeds (Spotify allows max 5 total)
  const totalSeeds = [...seedArtists, ...seedTracks].slice(0, 5);

  // Get recommendations based on seeds
  const { data: recommendations, isLoading: recsLoading, refetch } = useQuery({
    queryKey: ['recommendations', ...seedArtists, ...seedTracks],
    queryFn: () => recommendationsApi.getRecommendations({
      seed_artists: seedArtists.length > 0 ? seedArtists : undefined,
      seed_tracks: seedTracks.length > 0 ? seedTracks : undefined,
      limit: 30,
    }),
    enabled: backendConfigured && totalSeeds.length > 0,
    refetchOnMount: true,
  });

  const isLoading = artistsLoading || followedLoading || topTracksLoading || recsLoading;
  const isError = !backendConfigured || (!isLoading && !recommendations && !topTracks);

  const toggleArtistSeed = (artistId: string) => {
    setSelectedArtistIds(prev =>
      prev.includes(artistId)
        ? prev.filter(id => id !== artistId)
        : prev.length < 5
          ? [...prev, artistId]
          : prev
    );
  };

  if (!backendConfigured) {
    return <WaitingForBackend />;
  }


  const recommendedTracks = recommendations?.tracks ?? [];

  return (

    <div className="min-h-full">
      {/* Hero Header */}
      <AnimatedContainer animation="fade-in">
        <div className="p-6 pb-0 bg-gradient-to-b from-primary/20 to-transparent">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-black">Made For You</h1>
          </div>
          <p className="text-muted-foreground mb-6">
            Personalized recommendations based on your listening history
          </p>
        </div>
      </AnimatedContainer>

      {/* Artist Seeds */}
      {availableArtists.length > 0 && (
        <AnimatedContainer delay={100} animation="fade-in">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Based on your favorite artists
              </h2>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableArtists.slice(0, 8).map((artist) => (
                <ArtistSeed
                  key={artist.id}
                  artist={artist}
                  isSelected={selectedArtistIds.includes(artist.id)}
                  onToggle={() => toggleArtistSeed(artist.id)}
                />
              ))}
            </div>
          </div>
        </AnimatedContainer>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="p-6">
          <div className="h-8 w-48 bg-surface-3 rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
          {[...Array(10)].map((_, i) => <SkeletonTrackRow key={i} />)}
        </div>
      )}

      {/* Recommendations */}
      {!isLoading && recommendedTracks.length > 0 && (
        <div className="p-6">
          {/* Featured Tracks Grid */}
          <AnimatedContainer delay={150} animation="fade-in">
            <h2 className="text-2xl font-bold mb-4">Recommended for you</h2>
          </AnimatedContainer>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
            {recommendedTracks.slice(0, 6).map((track, index) => (
              <TrackCard
                key={track.id}
                track={track}
                index={index}
                isPlaying={currentTrackId === track.id && isPlaying}
                onPlay={() => {
                  setCurrentTrackId(track.id);
                  setIsPlaying(true);
                }}
              />
            ))}
          </div>

          {/* Full Track List */}
          <AnimatedContainer delay={200} animation="fade-in">
            <h2 className="text-2xl font-bold mb-4">All recommendations</h2>
          </AnimatedContainer>
          <div className="bg-surface-1/30 rounded-lg overflow-hidden">
            {/* Header */}
            <AnimatedContainer delay={220} animation="fade-in">
              <div className="grid grid-cols-[16px_4fr_2fr_minmax(80px,1fr)] gap-4 px-4 py-2 border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                <span>#</span>
                <span>Title</span>
                <span>Album</span>
                <span className="text-right"><Clock className="h-4 w-4 inline" /></span>
              </div>
            </AnimatedContainer>
            {recommendedTracks.map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                index={index}
                isPlaying={currentTrackId === track.id && isPlaying}
                onPlay={() => {
                  setCurrentTrackId(track.id);
                  setIsPlaying(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <AnimatedContainer animation="fade-in">
          <div className="text-center py-20">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">We couldn't generate recommendations for you.</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-black rounded-full font-bold hover:scale-105 transition-transform"
            >
              Try Again
            </button>
          </div>
        </AnimatedContainer>
      )}

      {/* Empty State */}
      {!isLoading && !isError && recommendedTracks.length === 0 && (
        <AnimatedContainer animation="fade-in">
          <div className="text-center py-20">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No recommendations yet</h2>
            <p className="text-muted-foreground">Listen to more music to get personalized recommendations</p>
          </div>
        </AnimatedContainer>
      )}
    </div>

  );
}
