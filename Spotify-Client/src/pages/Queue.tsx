import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Pause, Heart, MoreHorizontal, AlertCircle, Clock, GripVertical } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { SkeletonTrackRow } from '@/components/ui/skeleton-cards';
import { playerApi, isBackendConfigured } from '@/services/api';
import type { SpotifyTrack } from '@/types/spotify';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function QueueTrackRow({ track, index, isNowPlaying, onPlay, onRemove }: { 
  track: SpotifyTrack; 
  index: number; 
  isNowPlaying?: boolean;
  onPlay: () => void;
  onRemove?: () => void;
}) {
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <AnimatedContainer delay={index * 25} animation="fade-in">
      <div 
        className={cn(
          "group grid grid-cols-[20px_16px_4fr_2fr_minmax(80px,1fr)] gap-4 px-4 py-2 rounded-md items-center text-sm transition-all duration-150",
          isNowPlaying ? "bg-surface-2" : "hover:bg-surface-2/50"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={onPlay}
      >
        {/* Drag Handle */}
        <div className="opacity-0 group-hover:opacity-100 cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Track Number / Play Button */}
        <div className="flex items-center justify-center">
          {isHovered || isNowPlaying ? (
            <button onClick={onPlay} className="text-foreground hover:text-primary transition-colors">
              {isNowPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current" />
              )}
            </button>
          ) : (
            <span className={cn("tabular-nums", isNowPlaying ? "text-primary" : "text-muted-foreground")}>
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
              isNowPlaying ? "text-primary" : "group-hover:text-primary"
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

        {/* Actions & Duration */}
        <div className="flex items-center justify-end gap-3">
          <button 
            onClick={() => setIsLiked(!isLiked)}
            className={cn(
              "transition-all duration-200",
              isLiked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          >
            <Heart className={cn(
              "h-4 w-4 transition-all",
              isLiked ? "text-primary fill-primary" : "text-muted-foreground hover:text-foreground"
            )} />
          </button>
          <span className="text-muted-foreground tabular-nums">{formatDuration(track.duration_ms)}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-surface-3 rounded transition-all">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-surface-3 border-border">
              <DropdownMenuItem className="hover:bg-surface-4" onClick={onRemove}>
                Remove from queue
              </DropdownMenuItem>
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
              <DropdownMenuItem className="hover:bg-surface-4">Add to playlist</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-surface-4">Share</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
      <p className="text-muted-foreground max-w-md">Configure your backend URL to view your queue.</p>
    </div>
  );
}

export default function Queue() {
  const backendConfigured = isBackendConfigured();

  const { data: playbackState, isLoading: playbackLoading } = useQuery({
    queryKey: ['playbackState'],
    queryFn: playerApi.getCurrentPlayback,
    enabled: backendConfigured,
    refetchInterval: 5000,
  });

  const { data: queue, isLoading: queueLoading } = useQuery({
    queryKey: ['queue'],
    queryFn: playerApi.getQueue,
    enabled: backendConfigured,
    staleTime: 1000 * 10, // Queue changes frequently
  });

  if (!backendConfigured) {
    return <WaitingForBackend />;
  }

  const isLoading = playbackLoading || queueLoading;

  if (isLoading) {
    return (
      
        <div className="p-6 animate-fade-in">
          <div className="h-10 w-32 bg-surface-3 rounded mb-8 animate-pulse" />
          <div className="h-6 w-24 bg-surface-3 rounded mb-4 animate-pulse" />
          <SkeletonTrackRow />
          <div className="h-6 w-24 bg-surface-3 rounded my-6 animate-pulse" />
          {[...Array(5)].map((_, i) => <SkeletonTrackRow key={i} />)}
        </div>
      
    );
  }

  const currentTrack = playbackState?.item;
  const upcomingTracks = queue?.queue ?? [];

  return (
    
      <div className="p-6">
        <AnimatedContainer animation="slide-up">
          <h1 className="text-3xl font-bold mb-8">Queue</h1>
        </AnimatedContainer>

        {/* Now Playing */}
        {currentTrack && (
          <section className="mb-8">
            <AnimatedContainer delay={50} animation="fade-in">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                Now Playing
              </h2>
            </AnimatedContainer>
            <QueueTrackRow
              track={currentTrack}
              index={0}
              isNowPlaying
              onPlay={() => {}}
            />
          </section>
        )}

        {/* Next in Queue */}
        {upcomingTracks.length > 0 && (
          <section>
            <AnimatedContainer delay={100} animation="fade-in">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                Next in Queue
              </h2>
            </AnimatedContainer>
            <div className="mb-4">
              {/* Table Header */}
              <AnimatedContainer delay={120} animation="fade-in">
                <div className="grid grid-cols-[20px_16px_4fr_2fr_minmax(80px,1fr)] gap-4 px-4 py-2 border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                  <span></span>
                  <span>#</span>
                  <span>Title</span>
                  <span>Album</span>
                  <span className="text-right"><Clock className="h-4 w-4 inline" /></span>
                </div>
              </AnimatedContainer>
              {upcomingTracks.map((track, index) => (
                <QueueTrackRow
                  key={`${track.id}-${index}`}
                  track={track}
                  index={index}
                  onPlay={() => {}}
                  onRemove={() => {}}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!currentTrack && upcomingTracks.length === 0 && (
          <AnimatedContainer animation="fade-in">
            <div className="text-center py-20">
              <h2 className="text-xl font-bold mb-2">Your queue is empty</h2>
              <p className="text-muted-foreground">Start playing music to see your queue here</p>
            </div>
          </AnimatedContainer>
        )}
      </div>
    
  );
}
