import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, Pause, Heart, Clock, MoreHorizontal, Search, Download, Shuffle, AlertCircle } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { SkeletonTrackRow } from '@/components/ui/skeleton-cards';
import { userApi, playerApi, libraryApi, isBackendConfigured } from '@/services/api';
import { usePlayerStore } from '@/stores/playerStore';
import type { SpotifyTrack } from '@/types/spotify';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MediaContextMenu } from '@/components/MediaContextMenu';

function TrackRow({ track, index, isPlaying, onPlay, onLikeToggle }: {
  track: SpotifyTrack;
  index: number;
  isPlaying: boolean;
  onPlay: () => void;
  onLikeToggle: (trackId: string, isLiked: boolean) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLikedOptimistic, setIsLikedOptimistic] = useState(true);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newLikedState = !isLikedOptimistic;
    setIsLikedOptimistic(newLikedState);
    onLikeToggle(track.id, newLikedState);
  };

  const addedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <AnimatedContainer delay={index * 20} animation="fade-in">
      <MediaContextMenu type="track" data={track} onPlay={onPlay}>
        <div
          className={cn(
            "group grid grid-cols-[16px_6fr_4fr_3fr_minmax(80px,1fr)] gap-4 px-4 py-2 rounded-md items-center text-sm transition-all duration-150",
            isPlaying ? "bg-surface-2" : "hover:bg-surface-2/50"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onDoubleClick={onPlay}
        >
          {/* Track Number / Play Button */}
          <div className="flex items-center justify-center">
            {isHovered || isPlaying ? (
              <button onClick={onPlay} className="text-foreground hover:text-primary transition-colors">
                {isPlaying ? (
                  <Pause className="h-4 w-4 fill-current" />
                ) : (
                  <Play className="h-4 w-4 fill-current" />
                )}
              </button>
            ) : (
              <span className={cn("tabular-nums", isPlaying ? "text-primary" : "text-muted-foreground")}>
                {index + 1}
              </span>
            )}
          </div>

          {/* Title & Artist */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={track.album.images[0]?.url || '/placeholder.svg'}
              alt={track.album.name}
              className="w-10 h-10 rounded object-cover shadow-sm"
            />
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
                    <Link
                      to={`/artist/${a.id}`}
                      className="hover:underline hover:text-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {a.name}
                    </Link>
                    {i < track.artists.length - 1 && ', '}
                  </span>
                ))}
              </p>
            </div>
          </div>

          {/* Album */}
          <Link
            to={`/album/${track.album.id}`}
            className="text-muted-foreground truncate hover:underline hover:text-foreground"
          >
            {track.album.name}
          </Link>

          {/* Date Added */}
          <p className="text-muted-foreground text-xs">{addedDate}</p>

          {/* Actions & Duration */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleLikeClick}
              className="transition-all duration-200 hover:scale-110 active:scale-90"
            >
              <Heart className={cn(
                "h-4 w-4 transition-all",
                isLikedOptimistic ? "text-primary fill-primary" : "text-muted-foreground hover:text-foreground"
              )} />
            </button>
            <span className="text-muted-foreground tabular-nums w-12 text-right">
              {formatDuration(track.duration_ms)}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-surface-3 rounded transition-all">
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-surface-3 border-border">
                <DropdownMenuItem className="hover:bg-surface-4">Add to queue</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-surface-4">
                  <Link to={`/artist/${track.artists[0]?.id}`} className="w-full">
                    Go to artist
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-surface-4">
                  <Link to={`/album/${track.album.id}`} className="w-full">
                    Go to album
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLikeClick}
                  className="hover:bg-surface-4"
                >
                  Remove from Liked Songs
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-surface-4">Add to playlist</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-surface-4">Share</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </MediaContextMenu>
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
      <p className="text-muted-foreground max-w-md">Configure your backend URL to view your liked songs.</p>
    </div>
  );
}

export default function LikedSongs() {
  const { playbackState } = usePlayerStore();
  const currentTrack = playbackState?.item;
  const isGlobalPlaying = playbackState?.is_playing;
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const backendConfigured = isBackendConfigured();

  const { data: savedTracks, isLoading, error } = useQuery({
    queryKey: ['savedTracks'],
    queryFn: userApi.getSavedTracks,
    enabled: backendConfigured,
    staleTime: 1000 * 60 * 2,
  });

  const { data: user } = useQuery({
    queryKey: ['userProfile'],
    queryFn: userApi.getProfile,
    enabled: backendConfigured,
  });

  if (!backendConfigured) {
    return <WaitingForBackend />;
  }

  if (isLoading) {
    return (

      <div className="animate-fade-in">
        <div className="flex gap-6 p-6 pb-4 bg-gradient-to-b from-indigo-800/50 to-transparent">
          <div className="w-56 h-56 bg-surface-3 rounded shadow-2xl animate-pulse" />
          <div className="flex flex-col justify-end gap-2">
            <div className="h-4 w-16 bg-surface-3 rounded animate-pulse" />
            <div className="h-12 w-48 bg-surface-3 rounded animate-pulse" />
            <div className="h-4 w-32 bg-surface-3 rounded animate-pulse mt-4" />
          </div>
        </div>
        <div className="px-6 pt-4">
          {[...Array(10)].map((_, i) => <SkeletonTrackRow key={i} />)}
        </div>
      </div>

    );
  }

  const tracks = savedTracks ?? [];
  const filteredTracks = searchQuery
    ? tracks.filter(track =>
      track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artists.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    : tracks;

  const totalDuration = tracks.reduce((sum, track) => sum + track.duration_ms, 0);
  const hours = Math.floor(totalDuration / 3600000);
  const minutes = Math.floor((totalDuration % 3600000) / 60000);

  const handlePlay = async (track?: SpotifyTrack) => {
    if (!filteredTracks.length) return;

    // Simple toggle for header button (no track arg)
    if (!track && isGlobalPlaying && currentTrack?.id === filteredTracks[0].id) {
      await playerApi.pause();
      return;
    }

    try {
      const uris = filteredTracks.map(t => t.uri);
      await playerApi.play({
        uris,
        offset: track ? { uri: track.uri } : undefined
      });
    } catch (error) {
      console.error('Failed to play:', error);
    }
  };

  const handleLikeToggle = async (trackId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await libraryApi.saveTrack(trackId);
      } else {
        await libraryApi.removeSavedTrack(trackId);
      }
      queryClient.invalidateQueries({ queryKey: ['savedTracks'] });
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  return (

    <div className="min-h-full">
      {/* Header */}
      <AnimatedContainer animation="fade-in">
        <div className="flex items-end gap-6 p-6 pb-6 bg-gradient-to-b from-purple-800 to-transparent h-[340px]">
          <div className="w-60 h-60 min-w-60 shadow-2xl flex items-center justify-center bg-gradient-to-br from-indigo-700 to-purple-500 rounded-sm">
            <Heart className="h-28 w-28 text-white fill-current animate-pulse-subtle" />
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <p className="text-sm font-bold uppercase tracking-normal mb-1">Playlist</p>
            <h1 className="text-[6rem] font-black leading-none tracking-tight mb-6">Liked Songs</h1>
            <div className="flex items-center gap-1 text-sm font-medium">
              {user && (
                <div className="flex items-center gap-2">
                  {user.images?.[0]?.url ? (
                    <img src={user.images[0].url} alt={user.display_name} className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-surface-3" />
                  )}
                  <span className="hover:underline cursor-pointer font-bold">{user.display_name}</span>
                </div>
              )}
              <span className="mx-1">•</span>
              <span>{tracks.length} songs,</span>
              <span className="text-muted-foreground ml-1 font-normal">
                {hours > 0 ? `about ${hours} hr ${minutes} min` : `${minutes} min`}
              </span>
            </div>
          </div>
        </div>
      </AnimatedContainer>

      {/* Action Bar */}
      <AnimatedContainer delay={100} animation="fade-in">
        <div className="flex items-center gap-6 px-6 py-4">
          <button
            onClick={() => handlePlay()}
            className="w-14 h-14 rounded-full bg-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl"
          >
            {isGlobalPlaying && currentTrack?.id === (filteredTracks[0]?.id || '') ? (
              <Pause className="h-6 w-6 text-primary-foreground fill-current" />
            ) : (
              <Play className="h-6 w-6 text-primary-foreground fill-current ml-1" />
            )}
          </button>
          <button className="p-2 text-muted-foreground hover:text-primary transition-all hover:scale-110">
            <Shuffle className="h-6 w-6" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-all hover:scale-110">
            <Download className="h-6 w-6" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-all hover:scale-110">
                <MoreHorizontal className="h-6 w-6" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-surface-3 border-border">
              <DropdownMenuItem className="hover:bg-surface-4">Add to queue</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:bg-surface-4">Share</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search */}
          <div className="ml-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search in Liked Songs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-surface-2 border-0 rounded-sm text-sm w-48 focus:w-64 transition-all focus:outline-none focus:ring-1 focus:ring-foreground/50"
            />
          </div>
        </div>
      </AnimatedContainer>

      {/* Track List */}
      <div className="px-6 pb-6">
        <AnimatedContainer delay={150} animation="fade-in">
          <div className="grid grid-cols-[16px_6fr_4fr_3fr_minmax(80px,1fr)] gap-4 px-4 py-2 border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
            <span>#</span>
            <span>Title</span>
            <span>Album</span>
            <span>Date added</span>
            <span className="text-right"><Clock className="h-4 w-4 inline" /></span>
          </div>
        </AnimatedContainer>

        <div className="mt-2">
          {filteredTracks.length > 0 ? (
            filteredTracks.map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                index={index}
                isPlaying={currentTrack?.id === track.id && isGlobalPlaying}
                onPlay={() => handlePlay(track)}
                onLikeToggle={handleLikeToggle}
              />
            ))
          ) : (
            <div className="py-20 text-center text-muted-foreground animate-fade-in">
              {searchQuery ? 'No matching songs found' : 'Songs you like will appear here'}
            </div>
          )}
        </div>
      </div>
    </div>

  );
}
